'use client';
import { useAIStore } from '@/lib/store';
import { Cpu, CheckCircle2, Download, AlertCircle } from 'lucide-react';

const STAGES = [
  { key: 'embedder',  label: 'Embedding model (MiniLM)',   mb: '90 MB'  },
  { key: 'generator', label: 'Answer model (Flan-T5)',      mb: '160 MB' },
  { key: 'ner',       label: 'Entity model (BERT-NER)',     mb: '30 MB'  },
];

export function ModelStatusBar() {
  const { embeddingLoaded, generatorLoaded, loadingError } = useAIStore();

  const statuses = [
    { label: 'Embedding model (MiniLM)',  mb: '90 MB',  loaded: embeddingLoaded  },
    { label: 'Answer model (Flan-T5)',    mb: '160 MB', loaded: generatorLoaded  },
  ];

  const allLoaded = embeddingLoaded && generatorLoaded;

  if (allLoaded) return (
    <div className="flex items-center justify-center gap-2 border-b border-white/5 bg-emerald-500/5 px-4 py-2 text-xs text-emerald-400 font-semibold">
      <CheckCircle2 className="h-3.5 w-3.5" />
      AI models ready — all processing is local and private
    </div>
  );

  if (loadingError) return (
    <div className="flex items-center justify-center gap-2 border-b border-white/5 bg-rose-500/5 px-4 py-2 text-xs text-rose-400 font-semibold">
      <AlertCircle className="h-3.5 w-3.5" />
      Model load failed — refresh the page to retry. ({loadingError})
    </div>
  );

  return (
    <div className="border-b border-white/5 bg-[#111518]/80 px-4 py-3">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2 mb-2">
          <Download className="h-3.5 w-3.5 text-sky-400 animate-bounce" />
          <span className="text-xs font-semibold text-sky-300">
            Downloading AI models for the first time (~280 MB total) — do not close this tab
          </span>
        </div>
        <div className="flex gap-4">
          {statuses.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              {s.loaded
                ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                : <span className="h-3 w-3 border border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
              }
              <span className={`text-[10px] font-mono ${s.loaded ? 'text-emerald-400' : 'text-slate-400'}`}>
                {s.label} ({s.mb}) {s.loaded ? '✓' : '...'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
