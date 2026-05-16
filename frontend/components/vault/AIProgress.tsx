'use client';

/**
 * AIProgress.tsx — Phase 4
 * Visual progress indicator for the AI pipeline steps.
 * Shows which step is active and a progress bar for NER chunk processing.
 */

import { Brain, FileSearch, Tag, Zap, CircleCheck, CircleAlert } from 'lucide-react';
import type { AIProgress as AIProgressType, AIStep } from '@/hooks/useDocumentAI';

const STEPS: { id: AIStep; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id:    'extracting',
    label: 'Extracting text',
    icon:  FileSearch,
    desc:  'PDF.js or Tesseract OCR',
  },
  {
    id:    'ner',
    label: 'Biomedical NER',
    icon:  Brain,
    desc:  'd4data/biomedical-ner-all',
  },
  {
    id:    'classifying',
    label: 'Classifying document',
    icon:  Tag,
    desc:  'Xenova/nli-deberta-v3-small',
  },
];

interface Props {
  progress: AIProgressType;
}

export function AIProgress({ progress }: Props) {
  const { step, pct } = progress;

  if (step === 'idle') return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5" /> AI Pipeline
      </p>

      {/* Step list */}
      <div className="space-y-2">
        {STEPS.map((s) => {
          const stepOrder = ['extracting', 'ner', 'classifying'];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx    = stepOrder.indexOf(s.id);

          const isDone    = step === 'done' || thisIdx < currentIdx;
          const isActive  = s.id === step;
          const isPending = thisIdx > currentIdx && step !== 'done';
          const isError   = step === 'error' && isActive;

          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                isActive  ? 'bg-sky-500/10 border border-sky-500/30' :
                isDone    ? 'opacity-60' :
                isPending ? 'opacity-30' : ''
              }`}
            >
              <div className={`flex-shrink-0 ${
                isError ? 'text-red-400' :
                isDone  ? 'text-green-400' :
                isActive ? 'text-sky-400 animate-pulse' :
                'text-slate-600'
              }`}>
                {isError   ? <CircleAlert className="h-4 w-4" /> :
                 isDone    ? <CircleCheck className="h-4 w-4" /> :
                             <Icon        className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {s.label}
                  {isActive && progress.total > 1 && s.id === 'ner' && (
                    <span className="ml-2 text-xs text-slate-400 font-normal">
                      ({progress.done}/{progress.total} chunks)
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {step !== 'done' && step !== 'error' && (
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-sky-400 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {step === 'done' && (
        <p className="flex items-center gap-2 text-sm text-green-400">
          <CircleCheck className="h-4 w-4" /> Analysis complete
        </p>
      )}

      {step === 'error' && (
        <p className="flex items-center gap-2 text-sm text-red-400">
          <CircleAlert className="h-4 w-4" /> AI pipeline failed
        </p>
      )}
    </div>
  );
}
