'use client';

/**
 * AIPage.tsx — Phase 5
 * AI Assistant backed by MiniLM semantic search + LaMini-Flan-T5-248M generation.
 * Features: guided onboarding, model status bar, suggested chips, source citations, drug-alert cards.
 */

import { useRef, useEffect, useState } from 'react';
import { Bot, Send, Loader2, RotateCcw, ShieldOff, Info, Cpu, Download, BookOpen } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { ModelStatusBar } from './ModelStatusBar';
import { DrugCheckerCard } from './DrugCheckerCard';
import { SourceChips } from './SourceChips';

const SUGGESTED = [
  'What medications am I currently prescribed?',
  'Summarize my records from the last 6 months',
  'Do metformin and ibuprofen interact?',
  'What are my latest HbA1c values?',
  'List all my diagnoses',
  'When was my last vaccination?',
];

function HowItWorksBanner() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-sky-500/20 bg-[#111518]/90 p-4 mb-4 backdrop-blur-md">
      <div className="text-xs text-slate-400 mb-3 leading-relaxed">
        <strong>How to Use:</strong> Start by uploading your medical records in the Vault page to index their contents. Once indexed, type any query below to interact with your secure local health assistant (e.g. asking for medications, HbA1c history, or checking for drug interactions). All answers are generated locally in your browser with 100% data confidentiality.
      </div>
      <div className="w-full h-px bg-white/5 my-2.5" />
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-sky-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-sky-300">How does the secure on-device AI system work?</span>
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{expanded ? 'Hide Details' : 'View System Details'}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-3 text-xs text-slate-300">
          <div className="flex gap-3">
            <Download className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">First visit — model download (~280 MB).</strong>{' '}
              Three AI models are downloaded from HuggingFace and cached in your browser:
              MiniLM-L6 for semantic search, BERT-NER for entity extraction, and Flan-T5 for question answering.
              This download only happens once. Subsequent visits load from local cache in seconds.
            </p>
          </div>
          <div className="flex gap-3">
            <Cpu className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">All processing is local.</strong>{' '}
              Every query runs entirely inside your browser via WebAssembly (WASM).
              Your records and questions are never sent to any external server or API.
            </p>
          </div>
          <div className="flex gap-3">
            <BookOpen className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">The AI only knows your uploaded records.</strong>{' '}
              Questions are answered using Retrieval-Augmented Generation (RAG) — the assistant searches
              your indexed documents for relevant passages, then generates an answer based only on
              what it finds. Upload documents in the Vault first to get useful answers.
            </p>
          </div>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
            <p className="text-yellow-200/80 text-xs">
              This is a small on-device model intended for convenience, not clinical decisions.
              Always consult a qualified healthcare provider for medical advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AIPage() {
  const { messages, sendMessage, clearChat, isThinking, modelsReady } = useAIAssistant();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

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
        <div className="mx-auto max-w-4xl space-y-4">
          <HowItWorksBanner />

          {messages.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10">
                <Bot className="h-7 w-7 text-sky-400" />
              </div>
              <p className="mb-1 text-lg font-semibold text-white">Ask your health records anything</p>
              {modelsReady ? (
                <p className="mb-6 text-sm text-slate-400">
                  AI models are loaded and ready. All processing happens on your device.
                </p>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-slate-400 mb-1">
                    Downloading AI models for the first time — this may take 1-3 minutes depending on your connection.
                  </p>
                  <p className="text-xs text-slate-500">
                    Three models totalling approximately 280 MB are being cached in your browser.
                    You can send a question now and it will be answered once models finish loading.
                  </p>
                </div>
              )}
              <p className="mb-4 text-xs text-slate-500">
                Suggested questions — select one or type your own below:
              </p>
              <div className="mx-auto grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-slate-300 hover:border-sky-500/50 hover:bg-sky-500/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              {!modelsReady && (
                <div className="mt-6 mx-auto max-w-xs">
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-1 rounded-full bg-sky-500 animate-pulse w-2/3" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Loading AI models…</p>
                </div>
              )}
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${
                m.role === 'user' ? 'rounded-2xl bg-sky-500 px-4 py-3 text-sm text-white' : 'space-y-1'
              }`}>
                {m.role === 'assistant' && m.content === '__thinking__' ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                    <span className="text-xs text-slate-400">Searching your records and generating response…</span>
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
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="rounded-xl border border-white/10 p-3 text-slate-400 hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <input
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
            placeholder={modelsReady ? 'Ask about your uploaded records…' : 'Models loading — you can type now and send once ready…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(input); }}
            disabled={isThinking}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isThinking || !modelsReady}
            title={!modelsReady ? 'Wait for models to finish loading' : 'Send message'}
            className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {!modelsReady && (
          <p className="mt-2 text-center text-xs text-slate-500">
            <ShieldOff className="mr-1 inline h-3 w-3" />
            Downloading and caching AI models (~280 MB total). This only happens once. Do not close the tab.
          </p>
        )}
      </div>
    </div>
  );
}
