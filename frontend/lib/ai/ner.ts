/**
 * ner.ts — Phase 4
 * Biomedical Named Entity Recognition using @xenova/transformers.
 * Model: Xenova/bert-base-NER (fallback until d4data ONNX is available)
 */

import { pipeline } from '@xenova/transformers';
import { asTokenClassification } from './pipeline-utils';

let nerPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

const BIOMEDICAL_NER_MODEL = 'Xenova/bert-base-NER';
// Swap below once d4data/biomedical-ner-all ONNX conversion is available:
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
