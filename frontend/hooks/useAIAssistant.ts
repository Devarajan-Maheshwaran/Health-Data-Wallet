'use client';

/**
 * useAIAssistant.ts — Phase 5
 * Full AI Assistant chat state manager.
 * Wires RAG pipeline + drug interaction detection per message.
 */

import { useState, useCallback, useEffect } from 'react';
import { useRAG }            from './useRAG';
import { checkInteractions } from '@/lib/ai/drugChecker';
import type { CheckResult }  from '@/lib/ai/drugChecker';
import type { StoredChunk }  from '@/lib/ai/embeddings';
import { useAIStore }        from '@/lib/store';

export interface ChatMessage {
  id:         string;
  role:       'user' | 'assistant';
  content:    string;
  sources?:   Array<StoredChunk & { score: number }>;
  drugCheck?: CheckResult;
  timestamp:  number;
}

export function useAIAssistant() {
  const [messages, setMessages]                  = useState<ChatMessage[]>([]);
  const { warmUp, ask, status, error }           = useRAG();
  const { embeddingLoaded, generatorLoaded }     = useAIStore();

  useEffect(() => { warmUp(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: query, timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    const thinkingId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: thinkingId, role: 'assistant', content: '__thinking__', timestamp: Date.now(),
    }]);

    const ragResult = await ask(query);

    // Drug interaction check from query words
    let drugCheck: CheckResult | undefined;
    const words = [...query.matchAll(/\b([a-z]{4,})\b/gi)].map(m => m[1]);
    if (words.length >= 2) {
      const cr = checkInteractions(words);
      if (cr.interactions.length > 0) drugCheck = cr;
    }
    // Also check from retrieved prescription chunks
    if (!drugCheck && ragResult?.chunks.length) {
      const chunkDrugs = ragResult.chunks
        .filter(c => c.docType === 1)
        .flatMap(c => c.text.match(/\b[a-z]{4,}\b/gi) ?? []);
      if (chunkDrugs.length >= 2) {
        const cr = checkInteractions(chunkDrugs);
        if (cr.interactions.length > 0) drugCheck = cr;
      }
    }

    const answer = ragResult?.answer ??
      (error ? `Error: ${error}` : 'No answer could be generated from your records.');

    setMessages(prev => prev.map(m => m.id === thinkingId
      ? { id: thinkingId, role: 'assistant' as const, content: answer, sources: ragResult?.chunks, drugCheck, timestamp: Date.now() }
      : m
    ));
  }, [ask, error]);

  const clearChat = useCallback(() => setMessages([]), []);

  return {
    messages,
    sendMessage,
    clearChat,
    isThinking: status === 'searching' || status === 'generating',
    status,
    error,
    modelsReady: embeddingLoaded && generatorLoaded,
  };
}
