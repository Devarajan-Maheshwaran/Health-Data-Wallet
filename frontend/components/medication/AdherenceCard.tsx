'use client';

/**
 * AdherenceCard.tsx — Phase 6
 * Shows a 30-day adherence ring + stats per medication.
 */

import type { AdherenceStats } from '@/lib/medication';

interface Props { stats: AdherenceStats[] }

function Ring({ value }: { value: number }) {
  const r  = 20;
  const c  = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  const color = pct >= 0.8 ? '#22c55e' : pct >= 0.5 ? '#eab308' : '#ef4444';
  return (
    <svg width="52" height="52" className="flex-shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#ffffff10" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" fontSize="10" fill={color} fontWeight="600">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export function AdherenceCard({ stats }: Props) {
  if (stats.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">30-Day Adherence</h3>
      <div className="space-y-3">
        {stats.map(s => (
          <div key={s.planId} className="flex items-center gap-4">
            <Ring value={s.adherenceRate} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium capitalize text-white">{s.drugName}</p>
              <p className="text-xs text-slate-500">
                {s.taken}/{s.totalScheduled} doses taken
                {s.skipped > 0 && ` · ${s.skipped} skipped`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
