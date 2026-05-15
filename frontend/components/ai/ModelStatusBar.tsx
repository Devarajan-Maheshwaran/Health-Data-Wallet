'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { useAIStore }           from '@/lib/store';

const MODELS = [
  { key: 'nerLoaded'        as const, label: 'BioNER',     desc: 'bert-base-NER'        },
  { key: 'classifierLoaded' as const, label: 'Classifier', desc: 'nli-deberta-v3-small' },
  { key: 'embeddingLoaded'  as const, label: 'MiniLM',     desc: 'all-MiniLM-L6-v2'     },
  { key: 'generatorLoaded'  as const, label: 'LaMini-T5',  desc: 'LaMini-Flan-T5-248M'  },
];

export function ModelStatusBar() {
  const store = useAIStore();
  return (
    <div className="border-b border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-1">
        {MODELS.map(({ key, label, desc }) => {
          const loaded = store[key];
          return (
            <span key={key} title={desc} className={`flex items-center gap-1.5 text-xs ${
              loaded ? 'text-green-400' : 'text-slate-500'
            }`}>
              {loaded ? <CheckCircle className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
              {label}
            </span>
          );
        })}
        <span className="ml-auto hidden text-xs text-slate-600 sm:block">
          All inference runs locally · Zero data leaves your device
        </span>
      </div>
    </div>
  );
}
