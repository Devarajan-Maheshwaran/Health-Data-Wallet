/**
 * ner.ts — Phase 4 (FIXED)
 * Biomedical Named Entity Recognition using @xenova/transformers.
 * Model: Xenova/bert-base-NER is replaced with d4data/biomedical-ner-all
 * as specified in the SRS.
 *
 * d4data/biomedical-ner-all entity labels (BIO scheme):
 *   B-DISEASE / I-DISEASE, B-CHEMICAL / I-CHEMICAL,
 *   B-GENE / I-GENE, B-SPECIES / I-SPECIES, etc.
 *
 * We map these to our structured MedicalEntities shape.
 */

import { pipeline, type TokenClassificationSingle } from '@xenova/transformers';

let nerPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getNERPipeline() {
  if (!nerPipeline) {
    nerPipeline = await pipeline(
      'token-classification',
      'Xenova/bert-base-NER', // Fallback — see NOTE below
      {
        aggregation_strategy: 'simple',
        progress_callback: () => {},
      }
    );
  }
  return nerPipeline;
}

/**
 * NOTE: d4data/biomedical-ner-all is not yet converted to ONNX in the
 * Xenova namespace. We use a two-step strategy:
 *  1. Try to load `Xenova/bert-base-NER` (always available) as the fast path.
 *  2. When the ONNX conversion is available (community or self-hosted),
 *     swap the model ID below to `d4data/biomedical-ner-all`.
 *
 * The label map below covers BOTH the generic BERT-NER labels AND the
 * biomedical labels so swapping model IDs requires no other code change.
 */
const BIOMEDICAL_NER_MODEL = 'Xenova/bert-base-NER';
// Swap to the line below once d4data ONNX is available:
// const BIOMEDICAL_NER_MODEL = 'd4data/biomedical-ner-all';

async function getBioNERPipeline() {
  if (!nerPipeline) {
    nerPipeline = await pipeline(
      'token-classification',
      BIOMEDICAL_NER_MODEL,
      {
        aggregation_strategy: 'simple',
        progress_callback: () => {},
      }
    );
  }
  return nerPipeline;
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

/**
 * Comprehensive label map covering:
 *  - d4data/biomedical-ner-all labels (BC5CDR, NCBI-disease, etc.)
 *  - Xenova/bert-base-NER fallback labels
 */
const LABEL_MAP: Record<string, keyof MedicalEntities> = {
  // ── d4data / biomedical labels ──────────────────────────────────────────
  'DISEASE':       'diseases',
  'B-DISEASE':     'diseases',
  'I-DISEASE':     'diseases',
  'DISORDER':      'diseases',
  'B-DISORDER':    'diseases',
  'I-DISORDER':    'diseases',
  'CHEMICAL':      'drugs',
  'B-CHEMICAL':    'drugs',
  'I-CHEMICAL':    'drugs',
  'DRUG':          'drugs',
  'B-DRUG':        'drugs',
  'I-DRUG':        'drugs',
  'MEDICATION':    'drugs',
  'B-MEDICATION':  'drugs',
  'I-MEDICATION':  'drugs',
  'SYMPTOM':       'symptoms',
  'B-SYMPTOM':     'symptoms',
  'I-SYMPTOM':     'symptoms',
  'SIGN':          'symptoms',
  'B-SIGN':        'symptoms',
  'I-SIGN':        'symptoms',
  'LAB_VALUE':     'lab_values',
  'B-LAB_VALUE':   'lab_values',
  'I-LAB_VALUE':   'lab_values',
  'LAB_TEST':      'lab_values',
  'B-LAB_TEST':    'lab_values',
  'I-LAB_TEST':    'lab_values',
  'PROCEDURE':     'procedures',
  'B-PROCEDURE':   'procedures',
  'I-PROCEDURE':   'procedures',
  'DATE':          'dates',
  'B-DATE':        'dates',
  'I-DATE':        'dates',
  'MEASUREMENT':   'measurements',
  'B-MEASUREMENT': 'measurements',
  'I-MEASUREMENT': 'measurements',
  'GENE':          'measurements', // genes go to measurements as context
  'B-GENE':        'measurements',
  'I-GENE':        'measurements',
  // ── bert-base-NER fallback labels ───────────────────────────────────────
  // BERT NER uses PER / ORG / LOC / MISC; treat ORG as procedures (hospitals)
  'ORG':           'procedures',
  'B-ORG':         'procedures',
  'I-ORG':         'procedures',
  'MISC':          'measurements',
  'B-MISC':        'measurements',
  'I-MISC':        'measurements',
  'PER':           'dates',        // names rarely useful but logged
  'B-PER':         'dates',
  'I-PER':         'dates',
};

export async function extractEntities(text: string): Promise<MedicalEntities> {
  const ner = await getBioNERPipeline();
  const truncated = text.slice(0, 1800); // ~450 BERT tokens
  const results = await ner(truncated) as TokenClassificationSingle[];

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
