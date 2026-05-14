'use client';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAIStore } from '@/lib/store';
import { Bot, Send, Loader2, Pill } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What medications am I currently prescribed?',
  'Summarize my records from the last 6 months',
  'Do metformin and ibuprofen interact?',
  'What are my latest HbA1c values?',
];

interface Message { role: 'user' | 'assistant'; content: string; }

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const { nerLoaded, classifierLoaded, embeddingLoaded, generatorLoaded } = useAIStore();

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setIsThinking(true);
    // AI pipeline wired in Phase 4/5
    setTimeout(() => {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: 'AI pipeline loading — models will respond here once Transformers.js is initialised in Phase 4.',
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
      <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-textPrimary">AI Assistant</h1>
          <div className="flex gap-2">
            {modelStatus.map((m) => (
              <Badge key={m.label} variant={m.loaded ? 'success' : 'default'}>
                {m.label} {m.loaded ? '✓' : '○'}
              </Badge>
            ))}
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

          {/* Input */}
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
        </Card>
      </div>
    </AppShell>
  );
}
