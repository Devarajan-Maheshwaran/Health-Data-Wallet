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

export interface AIWorkerResult {
  entities: import('./ner').MedicalEntities;
  docType:  import('./classifier').DocumentType;
  docLabel: string;
  confidence: number;
}

type IncomingMessage =
  | { type: 'RUN_AI'; payload: { text: string; filename: string } };

self.addEventListener('message', async (event: MessageEvent<IncomingMessage>) => {
  const { type, payload } = event.data;

  if (type === 'RUN_AI') {
    const { text, filename } = payload;

    try {
      // Step 1: Chunk the document for NER
      const chunks = chunkText(text, 300, 50);
      const totalChunks = chunks.length;

      self.postMessage({
        type: 'PROGRESS',
        payload: { step: 'ner', done: 0, total: totalChunks },
      });

      // Step 2: Run NER across all chunks
      const entities = await extractEntitiesFromChunks(
        chunks,
        (done, total) => {
          self.postMessage({
            type: 'PROGRESS',
            payload: { step: 'ner', done, total },
          });
        }
      );

      self.postMessage({
        type: 'PROGRESS',
        payload: { step: 'classify', done: 0, total: 1 },
      });

      // Step 3: Instant heuristic classification (no model wait)
      const heuristicType = heuristicClassify(text, filename);

      // Step 4: Zero-shot classification (uses Xenova/nli-deberta-v3-small)
      let docType = heuristicType;
      let docLabel = 'general health document';
      let confidence = 0.5;

      try {
        const classResult = await classifyDocument(text);
        docType = classResult.docType;
        docLabel = classResult.label;
        confidence = classResult.score;
      } catch {
        // Classifier failed — keep heuristic result
      }

      self.postMessage({
        type: 'PROGRESS',
        payload: { step: 'classify', done: 1, total: 1 },
      });

      // Step 5: Return result
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
