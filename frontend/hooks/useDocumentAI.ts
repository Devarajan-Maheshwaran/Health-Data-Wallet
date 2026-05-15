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

        worker.onmessage = (e: MessageEvent) => {
          const { type, payload } = e.data;

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
            const msg = payload.message ?? 'AI worker error';
            setError(msg);
            setProgress(p => ({ ...p, step: 'error' }));
            worker.terminate();
            reject(new Error(msg));
          }
        };

        worker.onerror = (e) => {
          const msg = e.message ?? 'Worker crashed';
          setError(msg);
          setProgress(p => ({ ...p, step: 'error' }));
          reject(new Error(msg));
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
