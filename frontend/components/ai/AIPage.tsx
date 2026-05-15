'use client';

/**
 * AIPage.tsx — Phase 5 (fully wired)
 * AI Assistant backed by MiniLM semantic search + LaMini-Flan-T5-248M generation.
 * Features: model status bar, suggested chips, source citations, drug-alert cards.
 */

import { useRef, useEffect, useState } from 'react';
import { Bot, Send, Loader2, RotateCcw, ShieldOff } from 'lucide-react';
import { useAIAssistant }  from '@/hooks/useAIAssistant';
import { ModelStatusBar }  from './ModelStatusBar';
import { DrugCheckerCard } from './DrugCheckerCard';
import { SourceChips }     from './SourceChips';

const SUGGESTED = [
  'What medications am I currently prescribed?',
  'Summarize my records from the last 6 months',
  'Do metformin and ibuprofen interact?',
  'What are my latest HbA1c values?',
  'List all my diagnoses',
  'When was my last vaccination?',
];

export function AIPage() {
  const { messages, sendMessage, clearChat, isThinking, modelsReady } = useAIAssistant();
  const [input, setInput] = useState('');
  const bottomRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim() || isThinking) return;
    setInput('');
    sendMessage(text);
  };

  return (
    <div className="flex h-screen flex-col bg-[#0A0F1E] pt-16">
      <ModelStatusBar />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          {messages.length === 0 && (
            <div className="py-12 text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-sky-400" />
              <p className="mb-2 text-lg font-medium text-white">Ask your health records anything</p>
              <p className="mb-8 text-sm text-slate-500">
                {modelsReady
                  ? 'Models ready · All processing happens on your device'
                  : 'Loading AI models… first query may take ~30 s'}
              </p>
              <div className="mx-auto grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => handleSend(q)}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-slate-300 hover:border-sky-500/50 hover:bg-sky-500/10">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${
                m.role === 'user' ? 'rounded-2xl bg-sky-500 px-4 py-3 text-sm text-white' : 'space-y-1'
              }`}>
                {m.role === 'assistant' && m.content === '__thinking__' ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                  </div>
                ) : m.role === 'assistant' ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 whitespace-pre-wrap">
                      {m.content}
                    </div>
                    {m.sources && m.sources.length > 0 && <SourceChips chunks={m.sources} />}
                    {m.drugCheck && <DrugCheckerCard result={m.drugCheck} />}
                  </>
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0A0F1E] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          {messages.length > 0 && (
            <button onClick={clearChat} title="Clear chat"
              className="rounded-xl border border-white/10 p-3 text-slate-400 hover:bg-white/5">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <input
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
            placeholder="Ask about your records…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(input); }}
            disabled={isThinking}
          />
          <button onClick={() => handleSend(input)} disabled={isThinking}
            className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50">
            {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {!modelsReady && (
          <p className="mt-2 text-center text-xs text-slate-600">
            <ShieldOff className="mr-1 inline h-3 w-3" />
            Downloading AI models on first load (~280 MB total, cached after)
          </p>
        )}
      </div>
    </div>
  );
}
