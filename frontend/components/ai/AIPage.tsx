'use client';

import { useState } from 'react';
import { Bot, Loader2, Cpu, CheckCircle } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTED = [
  'Summarize my records from the last 6 months',
  'What medications am I currently prescribed?',
  'Do metformin and lisinopril interact?',
  'What is my latest HbA1c value?',
];

export function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelStatus] = useState({ ner: true, lm: true, embed: true });

  const send = async (query: string) => {
    if (!query.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    // AI pipeline will be wired in Phase 4+5
    // Placeholder response for Phase 2 scaffold
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚙️ AI pipeline loading in Phase 4. Models (BioNER, LaMini-T5, MiniLM embeddings) will run in-browser via WebAssembly — no data leaves your device.',
        },
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex h-screen flex-col bg-[#0A0F1E] pt-16">
      {/* Model status bar */}
      <div className="border-b border-white/10 bg-white/5 px-4 py-2">
        <div className="mx-auto flex max-w-4xl items-center gap-4 text-xs">
          {[
            { label: 'BioNER', ok: modelStatus.ner },
            { label: 'LaMini-T5', ok: modelStatus.lm },
            { label: 'MiniLM', ok: modelStatus.embed },
          ].map(({ label, ok }) => (
            <span key={label} className={`flex items-center gap-1 ${ok ? 'text-green-400' : 'text-slate-500'}`}>
              {ok ? <CheckCircle className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
              {label} {ok ? '✓' : 'loading…'}
            </span>
          ))}
          <span className="ml-auto text-slate-500">All models run locally · No data leaves your device</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-sky-400" />
              <p className="mb-6 text-lg font-medium text-white">Ask your health records anything</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-slate-300 hover:border-sky-500/50 hover:bg-sky-500/10"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'bg-sky-500 text-white'
                  : 'border border-white/10 bg-white/5 text-slate-200'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-[#0A0F1E] px-4 py-4">
        <div className="mx-auto flex max-w-4xl gap-3">
          <input
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
            placeholder="Ask about your records…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
          />
          <button
            onClick={() => send(input)}
            disabled={loading}
            className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
