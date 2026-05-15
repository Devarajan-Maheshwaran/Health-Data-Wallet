'use client';

/**
 * SafetyRadar.tsx — Phase 6
 * Polypharmacy safety panel.
 * Displays active drug-drug interactions for the current medication list.
 * Reuses DrugCheckerCard for consistent severity UI.
 */

import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { DrugCheckerCard }          from '@/components/ai/DrugCheckerCard';
import type { CheckResult }         from '@/lib/ai/drugChecker';

interface Props {
  radar:   CheckResult | null;
  loading: boolean;
  drugs:   string[];            // active drug names for context label
}

export function SafetyRadar({ radar, loading, drugs }: Props) {
  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl border border-white/5 bg-white/5" />;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Safety Radar</h3>
        {!radar ? (
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <ShieldCheck className="h-4 w-4" />
            No interactions detected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400">
            <ShieldAlert className="h-4 w-4" />
            {radar.interactions.length} interaction{radar.interactions.length !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {drugs.length > 0 && (
        <p className="text-xs text-slate-600">
          Monitoring: {drugs.map(d => <span key={d} className="capitalize">{d}</span>)
            .reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={i} className="text-slate-700">, </span>, el], [] as React.ReactNode[])}
        </p>
      )}

      {radar && <DrugCheckerCard result={radar} />}

      {!radar && drugs.length < 2 && (
        <p className="text-xs text-slate-600">
          Add 2 or more active medications to enable interaction scanning.
        </p>
      )}
    </div>
  );
}
