/**
 * classifier.ts — Phase 4
 * Zero-shot document type classification using Transformers.js.
 * Model: Xenova/nli-deberta-v3-small (~90 MB, cached in browser)
 *
 * Maps health documents to the DocumentType enum in the smart contract:
 * 0=LabReport, 1=Prescription, 2=Imaging, 3=Vaccination, 4=Discharge,
 * 5=Insurance, 6=DentalRecord, 7=VisionRecord, 8=MentalHealthNote,
 * 9=SurgicalNote, 10=PathologyReport, 11=Other
 */

import { asZeroShotClassification, getTransformers, withTimeout } from './pipeline-utils';
import { reportCLSProgress } from './model-store';

export const CANDIDATE_LABELS = [
  'laboratory blood test report',     // 0 — LabReport
  'prescription medication list',     // 1 — Prescription
  'radiology imaging MRI CT scan',    // 2 — Imaging
  'vaccination immunization record',  // 3 — Vaccination
  'hospital discharge summary',       // 4 — Discharge
  'insurance claim document',         // 5 — Insurance
  'dental teeth oral health record',  // 6 — DentalRecord
  'vision ophthalmology eye record',  // 7 — VisionRecord
  'mental health psychiatry note',    // 8 — MentalHealthNote
  'surgical operation procedure note',// 9 — SurgicalNote
  'pathology biopsy tissue report',   // 10 — PathologyReport
  'general health document',          // 11 — Other
];

export type DocumentType = 0|1|2|3|4|5|6|7|8|9|10|11;

let _classifierPipeline:  any = null;
let _classifierPromise:   Promise<any> | null = null;
let _classifierFromCache: boolean = false;

const CLASSIFIER_TIMEOUT_MS = 120_000;

export function classifierIsReady()   { return _classifierPipeline !== null; }
export function classifierFromCache() { return _classifierFromCache; }

export async function getClassifier(
  onProgress?: (pct: number, fromCache: boolean) => void
): Promise<any> {
  if (_classifierPipeline) {
    onProgress?.(100, _classifierFromCache);
    return _classifierPipeline;
  }
  if (_classifierPromise) return _classifierPromise;

  _classifierPromise = (async () => {
    const { pipeline } = await getTransformers();

    let progressReceived = false;

    const rawPromise = pipeline(
      'zero-shot-classification',
      'Xenova/nli-deberta-v3-small',
      {
        progress_callback: (p: any) => {
          if (p?.status === 'downloading' && p?.total > 0) {
            progressReceived = true;
            _classifierFromCache = false;
            const pct = Math.round((p.loaded / p.total) * 100);
            reportCLSProgress(pct, false);
            onProgress?.(pct, false);
          }
          if (p?.status === 'ready' || p?.status === 'loaded') {
            if (!progressReceived) {
              _classifierFromCache = true;
              reportCLSProgress(100, true);
              onProgress?.(100, true);
            } else {
              reportCLSProgress(100, false);
              onProgress?.(100, false);
            }
          }
        },
      }
    );

    _classifierPipeline = await withTimeout(
      rawPromise, CLASSIFIER_TIMEOUT_MS, 'Classifier model download'
    );
    return _classifierPipeline;
  })().catch((err) => {
    _classifierPipeline  = null;
    _classifierPromise   = null;
    _classifierFromCache = false;
    throw err;
  });

  return _classifierPromise;
}

export interface ClassificationResult {
  docType: DocumentType;
  label: string;
  score: number;
}

/**
 * Classifies a document text excerpt into one of the 12 document types.
 * Uses the first 512 chars — enough for title / header context.
 */
export async function classifyDocument(text: string): Promise<ClassificationResult> {
  const raw = await getClassifier();
  const classifier = asZeroShotClassification(raw);
  const excerpt = text.slice(0, 512);

  const result = await classifier(excerpt, CANDIDATE_LABELS);

  const topLabel = result.labels[0];
  const topScore = result.scores[0];
  const docType = CANDIDATE_LABELS.indexOf(topLabel) as DocumentType;

  return { docType: docType >= 0 ? docType : 11, label: topLabel, score: topScore };
}

/**
 * Fast heuristic classifier (no model needed) as instant fallback.
 * Used while the model loads to give an immediate UI result.
 */
export function heuristicClassify(text: string, filename: string): DocumentType {
  const combined = (filename + ' ' + text.slice(0, 300)).toLowerCase();

  if (/prescri|rx|medication|tablet|capsule|mg|dose/.test(combined))   return 1;
  if (/lab|blood|cbc|glucose|hba1c|creatinine|wbc|rbc|hgb/.test(combined)) return 0;
  if (/mri|ct scan|x-ray|ultrasound|radiology|imaging/.test(combined)) return 2;
  if (/vaccin|immuniz|mmr|covid|flu shot/.test(combined))              return 3;
  if (/discharge|admit|hospitali/.test(combined))                       return 4;
  if (/insurance|claim|policy|coverage/.test(combined))                return 5;
  if (/dental|teeth|tooth|oral|cavity/.test(combined))                 return 6;
  if (/vision|eye|ophthal|optom/.test(combined))                       return 7;
  if (/mental|psych|anxiety|depression|therapy/.test(combined))        return 8;
  if (/surgical|surgery|operation|incision/.test(combined))            return 9;
  if (/pathology|biopsy|histology|tissue/.test(combined))              return 10;
  return 11;
}
