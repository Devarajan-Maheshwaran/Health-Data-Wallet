/**
 * ner.ts — Phase 4
 * Biomedical Named Entity Recognition using @xenova/transformers.
 * Model: Xenova/bert-base-NER (fallback until d4data ONNX is available)
 */

import { asTokenClassification, getTransformers, withTimeout } from './pipeline-utils';
import { reportNERProgress } from './model-store';

let _nerPipeline:  any = null;
let _nerPromise:   Promise<any> | null = null;
let _nerFromCache: boolean = false;

const BIOMEDICAL_NER_MODEL = 'Xenova/bert-base-NER';
const NER_TIMEOUT_MS = 120_000; // 2 minutes max

export function nerIsReady()     { return _nerPipeline !== null; }
export function nerFromCache()   { return _nerFromCache; }

export async function getBioNERPipeline(
  onProgress?: (pct: number, fromCache: boolean) => void
): Promise<any> {
  if (_nerPipeline) {
    onProgress?.(100, _nerFromCache);
    return _nerPipeline;
  }
  if (_nerPromise) return _nerPromise;

  _nerPromise = (async () => {
    const { pipeline } = await getTransformers();

    let progressReceived = false;

    const rawPromise = pipeline(
      'token-classification',
      BIOMEDICAL_NER_MODEL,
      {
        progress_callback: (p: any) => {
          if (p?.status === 'downloading' && p?.total > 0) {
            progressReceived = true;
            _nerFromCache = false;
            const pct = Math.round((p.loaded / p.total) * 100);
            reportNERProgress(pct, false);
            onProgress?.(pct, false);
          }
          if (p?.status === 'ready' || p?.status === 'loaded') {
            if (!progressReceived) {
              // No download events = model was already in cache
              _nerFromCache = true;
              reportNERProgress(100, true);
              onProgress?.(100, true);
            } else {
              reportNERProgress(100, false);
              onProgress?.(100, false);
            }
          }
        },
      }
    );

    _nerPipeline = await withTimeout(rawPromise, NER_TIMEOUT_MS, 'NER model download');
    return _nerPipeline;
  })().catch((err) => {
    // Reset so caller can retry
    _nerPipeline  = null;
    _nerPromise   = null;
    _nerFromCache = false;
    throw err;
  });

  return _nerPromise;
}

export interface MedicalEntities {
  diseases:     string[];
  drugs:        string[];
  symptoms:     string[];
  lab_values:   string[];
  procedures:   string[];
  dates:        string[];
  measurements: string[];
}

const LABEL_MAP: Record<string, keyof MedicalEntities> = {
  'DISEASE': 'diseases',   'B-DISEASE': 'diseases',   'I-DISEASE': 'diseases',
  'DISORDER': 'diseases',  'B-DISORDER': 'diseases',  'I-DISORDER': 'diseases',
  'CHEMICAL': 'drugs',     'B-CHEMICAL': 'drugs',     'I-CHEMICAL': 'drugs',
  'DRUG': 'drugs',         'B-DRUG': 'drugs',         'I-DRUG': 'drugs',
  'MEDICATION': 'drugs',   'B-MEDICATION': 'drugs',   'I-MEDICATION': 'drugs',
  'SYMPTOM': 'symptoms',   'B-SYMPTOM': 'symptoms',   'I-SYMPTOM': 'symptoms',
  'SIGN': 'symptoms',      'B-SIGN': 'symptoms',      'I-SIGN': 'symptoms',
  'LAB_VALUE': 'lab_values', 'B-LAB_VALUE': 'lab_values', 'I-LAB_VALUE': 'lab_values',
  'LAB_TEST': 'lab_values',  'B-LAB_TEST': 'lab_values',  'I-LAB_TEST': 'lab_values',
  'PROCEDURE': 'procedures', 'B-PROCEDURE': 'procedures', 'I-PROCEDURE': 'procedures',
  'DATE': 'dates',         'B-DATE': 'dates',         'I-DATE': 'dates',
  'MEASUREMENT': 'measurements', 'B-MEASUREMENT': 'measurements', 'I-MEASUREMENT': 'measurements',
  'GENE': 'measurements',  'B-GENE': 'measurements',  'I-GENE': 'measurements',
  'ORG': 'procedures',     'B-ORG': 'procedures',     'I-ORG': 'procedures',
  'MISC': 'measurements',  'B-MISC': 'measurements',  'I-MISC': 'measurements',
  'PER': 'dates',          'B-PER': 'dates',           'I-PER': 'dates',
};

export async function extractEntities(text: string): Promise<MedicalEntities> {
  const raw = await getBioNERPipeline();
  const ner = asTokenClassification(raw);
  const truncated = text.slice(0, 1800);
  const results = await ner(truncated);

  const entities: MedicalEntities = {
    diseases: [], drugs: [], symptoms: [],
    lab_values: [], procedures: [], dates: [], measurements: [],
  };

  for (const result of results) {
    const label = (result.entity_group ?? result.entity ?? '').toUpperCase();
    const word = (result.word ?? '').replace(/^##/, '').trim();
    if (!word || word.length < 2) continue;
    const category = LABEL_MAP[label];
    if (category && !entities[category].includes(word)) {
      entities[category].push(word);
    }
  }

  return entities;
}

export async function extractEntitiesFromChunks(
  chunks: string[],
  onProgress?: (done: number, total: number) => void
): Promise<MedicalEntities> {
  const merged: MedicalEntities = {
    diseases: [], drugs: [], symptoms: [],
    lab_values: [], procedures: [], dates: [], measurements: [],
  };

  for (let i = 0; i < chunks.length; i++) {
    const chunkEntities = await extractEntities(chunks[i]);
    for (const key of Object.keys(merged) as (keyof MedicalEntities)[]) {
      for (const val of chunkEntities[key]) {
        if (!merged[key].includes(val)) merged[key].push(val);
      }
    }
    onProgress?.(i + 1, chunks.length);
  }

  return merged;
}
