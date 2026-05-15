'use client';

/**
 * useRAG.ts — Phase 5
 * React hook driving the full RAG pipeline:
 *   1. Semantic search (MiniLM + IndexedDB)
 *   2. Answer generation (LaMini-Flan-T5-248M)
 * Exposes warm-up, ask, cancel, reset + loading states.
 */

import { useState, useCallback, useRef } from 'react';
import { semanticSearch, getEmbedder, type StoredChunk } from '@/lib/ai/embeddings';
import { ragAnswer, getGenerator }                        from '@/lib/ai/generator';
import { useAIStore }                                    from '@/lib/store';

export type RAGStatus =
  | 'idle'
  | 'loading_embedder'
  | 'loading_generator'
  | 'searching'
  | 'generating'
  | 'done'
  | 'error';

export interface RAGResult {
  answer:  string;
  chunks:  Array<StoredChunk & { score: number }>;
  query:   string;
}

export function useRAG() {
  const [status, setStatus] = useState<RAGStatus>('idle');
  const [result, setResult] = useState<RAGResult | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const abortRef            = useRef(false);
  const { setModelLoaded }  = useAIStore();

  const warmUp = useCallback(async () => {
    try {
      setStatus('loading_embedder');
      await getEmbedder();
      setModelLoaded('embedding');

      setStatus('loading_generator');
      await getGenerator();
      setModelLoaded('generator');

      setStatus('idle');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Model load failed');
    }
  }, [setModelLoaded]);

  const ask = useCallback(async (query: string): Promise<RAGResult | null> => {
    if (!query.trim()) return null;
    abortRef.current = false;
    setError(null);
    setResult(null);

    try {
      setStatus('searching');
      const chunks = await semanticSearch(query, 5, 0.2);
      if (abortRef.current) return null;

      setStatus('generating');
      const answer = await ragAnswer(query, chunks);
      if (abortRef.current) return null;

      const r: RAGResult = { answer, chunks, query };
      setResult(r);
      setStatus('done');
      return r;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'RAG pipeline failed';
      setError(msg);
      setStatus('error');
      return null;
    }
  }, []);

  const cancel = useCallback(() => { abortRef.current = true; setStatus('idle'); }, []);
  const reset  = useCallback(() => { abortRef.current = true; setStatus('idle'); setResult(null); setError(null); }, []);

  return { warmUp, ask, status, result, error, cancel, reset };
}
