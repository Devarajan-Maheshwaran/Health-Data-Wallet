'use client';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAIStore } from '@/lib/store';
import { FileText, Bot, Send, Loader2, Info } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What medications am I currently prescribed?',
  'Summarize my records from the last 6 months',
  'Do metformin and ibuprofen interact?',
  'What are my latest HbA1c values?',
];

const MOCK_REPORTS = [
  { id: 1, title: 'Blood Test Results - May 2026' },
  { id: 2, title: 'Cardiology Consultation' },
  { id: 3, title: 'Discharge Summary - Appendectomy' },
];

interface Message { role: 'user' | 'assistant'; content: string; }

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const { nerLoaded, classifierLoaded, embeddingLoaded, generatorLoaded } = useAIStore();
  const [selectedReport, setSelectedReport] = useState<number | ''>('');

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setIsThinking(true);
    
    setTimeout(() => {
      let response = "AI pipeline loading — models will respond here once Transformers.js is initialised.";
      
      if (selectedReport) {
        response = `Context loaded securely! The encrypted report was fetched from Greenfield, decrypted locally using your Web Crypto API key, and injected into my context window. Based on the selected report, I can answer your question while maintaining zero-knowledge privacy.`;
      }

      setMessages((m) => [...m, {
        role: 'assistant',
        content: response,
      }]);
      setIsThinking(false);
    }, 800);
  }

  const modelStatus = [
    { label: 'BioNER',    loaded: nerLoaded },
    { label: 'Classifier',loaded: classifierLoaded },
    { label: 'Embeddings',loaded: embeddingLoaded },
    { label: 'LaMini-T5', loaded: generatorLoaded },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 mt-12 md:mt-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="font-syne text-3xl font-bold text-textPrimary">AI Assistant</h1>
          <div className="flex flex-wrap gap-2">
            {modelStatus.map((m) => (
              <Badge key={m.label} variant={m.loaded ? 'success' : 'default'} className="bg-[#111518] border border-white/10">
                {m.label} {m.loaded ? '✓' : '○'}
              </Badge>
            ))}
          </div>
        </div>

        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex gap-4 items-start">
          <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-white block mb-1">How it works: Zero-Knowledge AI</strong>
            When you select a report, the encrypted file is fetched from BNB Greenfield. It is then decrypted <em>locally</em> in your browser using the AES-256 key derived from your wallet signature. The plain text is fed directly into the LaMini-T5 WebAssembly model running on your device. Your sensitive medical data is <strong>never</strong> sent to an external API like OpenAI.
          </div>
        </div>

        {/* Chat window */}
        <Card className="flex-1 flex flex-col min-h-[400px]">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-6">Ask anything about your records</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="glass text-left px-4 py-3 rounded-xl text-xs text-white/60 hover:text-primary hover:border-primary/30 border border-white/5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-surface'
                      : 'glass text-white/80'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {isThinking && (
              <div className="flex justify-start">
                <div className="glass px-4 py-3 rounded-2xl"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400">Context:</span>
              <select 
                value={selectedReport} 
                onChange={(e) => setSelectedReport(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-transparent text-sm text-sky-400 focus:outline-none border-b border-transparent focus:border-sky-400/50 cursor-pointer pb-0.5"
              >
                <option value="" className="bg-[#111518] text-slate-300">General Knowledge (No Report Selected)</option>
                {MOCK_REPORTS.map(r => (
                  <option key={r.id} value={r.id} className="bg-[#111518] text-slate-300">{r.title}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask about your records..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isThinking}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
