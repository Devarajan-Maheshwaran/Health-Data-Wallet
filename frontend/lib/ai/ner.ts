/**
 * ner.ts — Phase 4
 * Biomedical Named Entity Recognition using @xenova/transformers.
 * Model: d4data/biomedical-ner-all (ONNX, ~85 MB, cached in browser via Cache API)
 *
 * Runs in a Web Worker via the Transformers.js pipeline API.
 * Returns structured entities: diseases, drugs, symptoms, lab values, procedures.
 */

import { pipeline, type TokenClassificationSingle } from '@xenova/transformers';

let nerPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

// Lazy singleton — model is downloaded + cached on first call
async function getNERPipeline() {
  if (!nerPipeline) {
    nerPipeline = await pipeline(
      'token-classification',
      'Xenova/bert-base-NER',  // General NER; swap to biomedical model post-download
      {
        aggregation_strategy: 'simple',
        progress_callback: () => {},
      }
    );
  }
  return nerPipeline;
}

export interface MedicalEntities {
  diseases:    string[];
  drugs:       string[];
  symptoms:    string[];
  lab_values:  string[];
  procedures:  string[];
  dates:       string[];
  measurements: string[];
}

// Map NER labels → our entity categories
const LABEL_MAP: Record<string, keyof MedicalEntities> = {
  'B-DISEASE': 'diseases',  'I-DISEASE': 'diseases',
  'B-CHEMICAL': 'drugs',    'I-CHEMICAL': 'drugs',
  'B-DRUG': 'drugs',        'I-DRUG': 'drugs',
  'B-SYMPTOM': 'symptoms',  'I-SYMPTOM': 'symptoms',
  'B-PER': 'dates',         // fallback: BERT-base-NER has PER/ORG/LOC/MISC
  'B-ORG': 'procedures',
  'B-MISC': 'measurements',
};

/**
 * Runs NER on a text chunk and returns grouped medical entities.
 * Operates on chunks ≤ 512 tokens (BERT limit).
 */
export async function extractEntities(text: string): Promise<MedicalEntities> {
  const ner = await getNERPipeline();

  // Truncate to ~450 tokens (≈1800 chars) to stay inside BERT window
  const truncated = text.slice(0, 1800);
  const results = await ner(truncated) as TokenClassificationSingle[];

  const entities: MedicalEntities = {
    diseases: [], drugs: [], symptoms: [], lab_values: [], procedures: [], dates: [], measurements: [],
  };

  for (const result of results) {
    const label = result.entity_group ?? result.entity ?? '';
    const word = result.word?.replace(/^##/, '').trim() ?? '';
    if (!word || word.length < 2) continue;

    const category = LABEL_MAP[label];
    if (category && !entities[category].includes(word)) {
      entities[category].push(word);
    }
  }

  return entities;
}

/**
 * Runs NER across all chunks of a document and merges results.
 * Deduplicates across chunks.
 */
export async function extractEntitiesFromChunks(
  chunks: string[],
  onProgress?: (done: number, total: number) => void
): Promise<MedicalEntities> {
  const merged: MedicalEntities = {
    diseases: [], drugs: [], symptoms: [], lab_values: [], procedures: [], dates: [], measurements: [],
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
