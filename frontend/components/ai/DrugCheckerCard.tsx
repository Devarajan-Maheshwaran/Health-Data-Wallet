'use client';

import type { CheckResult, DrugInteraction } from '@/lib/ai/drugChecker';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

const SEV_CONFIG = {
  major:    { icon: ShieldAlert,    bg: 'bg-red-500/10 border-red-500/30',       badge: 'bg-red-500/20 text-red-300',       label: 'Major',    text: 'text-red-300'    },
  moderate: { icon: AlertTriangle,  bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-300', label: 'Moderate', text: 'text-yellow-300' },
  minor:    { icon: Info,            bg: 'bg-sky-500/10 border-sky-500/30',       badge: 'bg-sky-500/20 text-sky-300',       label: 'Minor',    text: 'text-sky-300'    },
};

function InteractionRow({ ix }: { ix: DrugInteraction }) {
  const cfg  = SEV_CONFIG[ix.severity];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-xl border p-3 space-y-1 ${cfg.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${cfg.text}`} />
          <span className="text-sm font-medium text-white">{ix.drug1} + {ix.drug2}</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>{cfg.label}</span>
      </div>
      <p className="text-xs text-slate-300">{ix.effect}</p>
      <p className={`text-xs font-medium ${cfg.text}`}>⚑ {ix.recommendation}</p>
    </div>
  );
}

export function DrugCheckerCard({ result }: { result: CheckResult }) {
  if (result.interactions.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Drug Interaction Alert</p>
        {result.hasMajor && (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">{result.majorCount} major</span>
        )}
      </div>
      <div className="space-y-2">
        {result.interactions.map((ix, i) => <InteractionRow key={i} ix={ix} />)}
      </div>
      <p className="text-xs text-slate-500">⚠ Always consult your pharmacist or physician before making medication changes.</p>
    </div>
  );
}
