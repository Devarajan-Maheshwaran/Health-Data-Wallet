 'use client';

/**
 * useDocumentAI.ts — Phase 4
 * Orchestrates the full client-side AI pipeline for a dropped document:
 *
 *   1. Extract text  (PDF.js or Tesseract.js OCR)
 *   2. Run NER       (biomedical entity extraction across all chunks)
 *   3. Classify doc  (zero-shot → DocumentType enum value)
 *
 * All inference runs in a Web Worker so the UI thread stays responsive.
 * Falls back to inline (main-thread) execution if Workers are unavailable.
 */

import { useState, useCallback, useRef } from 'react';
import { extractText, chunkText } from '@/lib/ai/extractor';
import { extractEntitiesFromChunks, type MedicalEntities } from '@/lib/ai/ner';
import { classifyDocument, heuristicClassify, type DocumentType } from '@/lib/ai/classifier';
import { reportReady, reportError, checkIfModelsAreCached } from '@/lib/ai/model-store';

export type AIStep =
  | 'idle'
  | 'extracting'
  | 'ner'
  | 'classifying'
  | 'done'
  | 'error';

export interface AIProgress {
  step:  AIStep;
  done:  number; // chunks processed
  total: number; // total chunks
  pct:   number; // 0-100
}

export interface DocumentAIResult {
  text:       string;
  chunks:     string[];
  entities:   MedicalEntities;
  docType:    DocumentType;
  docLabel:   string;
  confidence: number;
}

// Singleton warmup — call this on page mount to pre-download models
let _warmupStarted = false;
let _warmupPromise: Promise<void> | null = null;

export function warmupModels(
  onNERProgress?: (pct: number, fromCache: boolean) => void,
  onClassifierProgress?: (pct: number, fromCache: boolean) => void
): Promise<void> {
  if (_warmupStarted && _warmupPromise) return _warmupPromise;
  _warmupStarted = true;

  _warmupPromise = (async () => {
    const isCached = await checkIfModelsAreCached();
    if (isCached) {
      reportReady();
    }

    await Promise.all([
      import('@/lib/ai/ner').then(m =>
        m.getBioNERPipeline(onNERProgress)
      ),
      import('@/lib/ai/classifier').then(m =>
        m.getClassifier(onClassifierProgress)
      ),
    ]);

    reportReady();
  })().catch((e) => {
    _warmupStarted = false;
    _warmupPromise = null;
    reportError(e?.message ?? 'Model load failed');
    throw e;
  });

  return _warmupPromise;
}

export function useDocumentAI() {
  const [progress, setProgress] = useState<AIProgress>({
    step: 'idle', done: 0, total: 0, pct: 0,
  });
  const [result, setResult]   = useState<DocumentAIResult | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const workerRef             = useRef<Worker | null>(null);

  const processFile = useCallback(async (file: File): Promise<DocumentAIResult> => {
    setError(null);
    setResult(null);

    // ── Step 1: Text extraction (always on main thread — no Worker needed) ──
    setProgress({ step: 'extracting', done: 0, total: 1, pct: 5 });
    let text: string;
    try {
      text = await extractText(file);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Text extraction failed';
      setError(msg);
      setProgress(p => ({ ...p, step: 'error' }));
      throw new Error(msg);
    }

    if (!text.trim()) {
      const msg = 'No text could be extracted from this file.';
      setError(msg);
      setProgress(p => ({ ...p, step: 'error' }));
      throw new Error(msg);
    }

    const chunks = chunkText(text, 300, 50);

    // Wait for models to be downloaded before firing the Worker
    // If warmupModels() was already called, this resolves instantly
    try {
      const [nerMod, clsMod] = await Promise.all([
        import('@/lib/ai/ner'),
        import('@/lib/ai/classifier'),
      ]);
      await Promise.all([
        nerMod.getBioNERPipeline(),
        clsMod.getClassifier(),
      ]);
    } catch (modelErr) {
      const msg = 'AI models have not finished downloading yet. ' +
        'Please wait for the model download to complete before uploading. ' +
        'Uploading without AI processing would store empty metadata on the ' +
        'blockchain, significantly increasing gas costs.';
      setError(msg);
      setProgress(p => ({ ...p, step: 'error' }));
      throw new Error(msg);
    }

    // ── Step 2: Try Web Worker path ──────────────────────────────────────────
    const canUseWorker = typeof Worker !== 'undefined';

    if (canUseWorker) {
      return new Promise<DocumentAIResult>((resolve, reject) => {
        // Terminate any previous worker
        workerRef.current?.terminate();
        const worker = new Worker(
          new URL('@/lib/ai/worker.ts', import.meta.url),
          { type: 'module' }
        );
        workerRef.current = worker;

        worker.onmessage = async (e: MessageEvent) => {
          const { type, payload } = e.data;

          if (type === 'WARMUP_PROGRESS') {
            const { model, pct, fromCache } = payload;
            window.dispatchEvent(new CustomEvent('ai-worker-warmup', {
              detail: { model, pct, fromCache }
            }));
          }

          if (type === 'MODELS_READY') {
            window.dispatchEvent(new CustomEvent('ai-worker-ready', {
              detail: { fromCache: payload.fromCache }
            }));
          }

          if (type === 'MODELS_FAILED') {
            window.dispatchEvent(new CustomEvent('ai-worker-failed', {
              detail: { message: payload.message }
            }));
          }

          if (type === 'PROGRESS') {
            const { step, done, total } = payload;
            // NER contributes 10-80%, classify 80-95%
            let pct = 0;
            if (step === 'ner')      pct = 10 + Math.round((done / Math.max(total, 1)) * 70);
            if (step === 'classify') pct = 80 + Math.round((done / 1) * 15);
            setProgress({ step, done, total, pct });
          }

          if (type === 'RESULT') {
            const r: DocumentAIResult = {
              text,
              chunks,
              entities:   payload.entities,
              docType:    payload.docType,
              docLabel:   payload.docLabel,
              confidence: payload.confidence,
            };
            setResult(r);
            setProgress({ step: 'done', done: 1, total: 1, pct: 100 });
            worker.terminate();
            resolve(r);
          }

          if (type === 'ERROR') {
            // Worker failed mid-inference — fall back to heuristic classify
            // so the upload can still proceed with partial metadata
            console.warn('[DocumentAI] Worker error, using heuristic fallback:', payload.message);
            const { heuristicClassify, CANDIDATE_LABELS } = await import('@/lib/ai/classifier');
            const heuristicType = heuristicClassify(text, file.name);
            const fallback: DocumentAIResult = {
              text,
              chunks,
              entities: {
                diseases: [], drugs: [], symptoms: [],
                lab_values: [], procedures: [], dates: [], measurements: [],
              },
              docType:    heuristicType,
              docLabel:   CANDIDATE_LABELS[heuristicType] ?? 'general health document',
              confidence: 0.3,
            };
            setResult(fallback);
            setProgress({ step: 'done', done: 1, total: 1, pct: 100 });
            worker.terminate();
            resolve(fallback);
          }
        };

        worker.onerror = async (e) => {
          console.warn('[DocumentAI] Worker error event, using heuristic fallback:', e.message);
          const { heuristicClassify, CANDIDATE_LABELS } = await import('@/lib/ai/classifier');
          const heuristicType = heuristicClassify(text, file.name);
          const fallback: DocumentAIResult = {
            text,
            chunks,
            entities: {
              diseases: [], drugs: [], symptoms: [],
              lab_values: [], procedures: [], dates: [], measurements: [],
            },
            docType:    heuristicType,
            docLabel:   CANDIDATE_LABELS[heuristicType] ?? 'general health document',
            confidence: 0.3,
          };
          setResult(fallback);
          setProgress({ step: 'done', done: 1, total: 1, pct: 100 });
          resolve(fallback);
        };

        worker.postMessage({ type: 'RUN_AI', payload: { text, filename: file.name } });
      });
    }

    // ── Fallback: main-thread inference (no Worker) ──────────────────────────
    setProgress({ step: 'ner', done: 0, total: chunks.length, pct: 10 });

    const entities = await extractEntitiesFromChunks(chunks, (done, total) => {
      setProgress({ step: 'ner', done, total, pct: 10 + Math.round((done / total) * 70) });
    });

    setProgress({ step: 'classifying', done: 0, total: 1, pct: 80 });

    const heuristic = heuristicClassify(text, file.name);
    let docType = heuristic;
    let docLabel = 'general health document';
    let confidence = 0.5;

    try {
      const cls = await classifyDocument(text);
      docType = cls.docType;
      docLabel = cls.label;
      confidence = cls.score;
    } catch {
      // keep heuristic
    }

    const final: DocumentAIResult = { text, chunks, entities, docType, docLabel, confidence };
    setResult(final);
    setProgress({ step: 'done', done: 1, total: 1, pct: 100 });
    return final;
  }, []);

  const reset = useCallback(() => {
    workerRef.current?.terminate();
    setResult(null);
    setError(null);
    setProgress({ step: 'idle', done: 0, total: 0, pct: 0 });
  }, []);

  return { processFile, progress, result, error, reset };
}
