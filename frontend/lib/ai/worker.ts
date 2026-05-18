/**
 * worker.ts — Phase 4
 * Dedicated Web Worker for AI model inference.
 * Runs NER + classification off the main thread so the UI stays responsive
 * during the ~2–5 second model inference.
 *
 * Communication protocol:
 *   Main → Worker: { type: 'RUN_AI', payload: { text: string, filename: string } }
 *   Worker → Main: { type: 'PROGRESS', payload: { step, total } }
 *                  { type: 'RESULT',   payload: AIWorkerResult }
 *                  { type: 'ERROR',    payload: { message } }
 */

import { extractEntitiesFromChunks } from './ner';
import { classifyDocument, heuristicClassify } from './classifier';
import { chunkText } from './extractor';
import { getBioNERPipeline } from './ner';
import { getClassifier } from './classifier';

export interface AIWorkerResult {
  entities:   import('./ner').MedicalEntities;
  docType:    import('./classifier').DocumentType;
  docLabel:   string;
  confidence: number;
}

// Pre-warm both models immediately when Worker spawns.
// The main thread already started warmup on mount, but Worker has
// its own module scope — this ensures Worker's singleton is loaded.
// Progress is posted so VaultPage can show combined real download %.
const warmup = Promise.all([
  getBioNERPipeline((pct, fromCache) => {
    self.postMessage({
      type: 'WARMUP_PROGRESS',
      payload: { model: 'ner', pct, fromCache },
    });
  }),
  getClassifier((pct, fromCache) => {
    self.postMessage({
      type: 'WARMUP_PROGRESS',
      payload: { model: 'classifier', pct, fromCache },
    });
  }),
]).then(() => {
  self.postMessage({ type: 'MODELS_READY', payload: { fromCache: true } });
}).catch((err) => {
  self.postMessage({
    type: 'MODELS_FAILED',
    payload: { message: err?.message ?? 'Model warmup failed in Worker' },
  });
});

type IncomingMessage =
  | { type: 'RUN_AI'; payload: { text: string; filename: string } };

self.addEventListener('message', async (event: MessageEvent<IncomingMessage>) => {
  const { type, payload } = event.data;

  if (type === 'RUN_AI') {
    const { text, filename } = payload;

    try {
      // Ensure warmup is complete before inference
      await warmup;

      const chunks      = chunkText(text, 300, 50);
      const totalChunks = chunks.length;

      self.postMessage({
        type: 'PROGRESS',
        payload: { step: 'ner', done: 0, total: totalChunks },
      });

      const entities = await extractEntitiesFromChunks(
        chunks,
        (done, total) => self.postMessage({
          type: 'PROGRESS',
          payload: { step: 'ner', done, total },
        })
      );

      self.postMessage({
        type: 'PROGRESS',
        payload: { step: 'classify', done: 0, total: 1 },
      });

      const heuristicType = heuristicClassify(text, filename);
      let docType    = heuristicType;
      let docLabel   = 'general health document';
      let confidence = 0.5;

      try {
        const classResult = await classifyDocument(text);
        docType    = classResult.docType;
        docLabel   = classResult.label;
        confidence = classResult.score;
      } catch {
        // keep heuristic
      }

      self.postMessage({
        type: 'PROGRESS',
        payload: { step: 'classify', done: 1, total: 1 },
      });

      self.postMessage({
        type: 'RESULT',
        payload: { entities, docType, docLabel, confidence } satisfies AIWorkerResult,
      });

    } catch (e: unknown) {
      self.postMessage({
        type: 'ERROR',
        payload: { message: e instanceof Error ? e.message : 'AI worker error' },
      });
    }
  }
});
