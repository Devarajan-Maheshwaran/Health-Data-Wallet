'use client';

/**
 * DailyTimeline.tsx — Phase 6
 * Renders today's medication schedule grouped by time-of-day slot.
 * Each pill card has one-tap Taken / Skip logging with optimistic UI.
 */

import { useState } from 'react';
import { CircleCheckBig, CircleX, CircleHelp, Pill } from 'lucide-react';
import type { TimelineSlot } from '@/hooks/useMedication';
import type { IntakeStatus } from '@/lib/medication';
import { SLOT_TIMES }         from '@/lib/medication';

interface Props {
  slots:   TimelineSlot[];
  onLog:   (planId: string, slotIndex: number, status: IntakeStatus) => Promise<void>;
  loading: boolean;
}

const STATUS_ICONS: Record<IntakeStatus, React.ReactNode> = {
  taken:   <CircleCheckBig className="h-4 w-4 text-green-400" />,
  skipped: <CircleX        className="h-4 w-4 text-red-400"   />,
  unknown: <CircleHelp     className="h-4 w-4 text-slate-500" />,
};

function PillCard({ slot, onLog }: { slot: TimelineSlot; onLog: Props['onLog'] }) {
  const [optimistic, setOptimistic] = useState<IntakeStatus | null>(slot.status);

  const handle = async (status: IntakeStatus) => {
    setOptimistic(status);
    await onLog(slot.plan.id, slot.slotIndex, status);
  };

  const current = optimistic ?? slot.status;

  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
      current === 'taken'   ? 'border-green-500/30 bg-green-500/5'   :
      current === 'skipped' ? 'border-red-500/30   bg-red-500/5'     :
      'border-white/10 bg-white/5'
    }`}>
      <div className="flex items-center gap-3">
        <Pill className="h-5 w-5 text-sky-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-white capitalize">
            {slot.plan.drugName}
            {slot.plan.brandName && (
              <span className="ml-1 text-xs text-slate-500">({slot.plan.brandName})</span>
            )}
          </p>
          <p className="text-xs text-slate-500">
            {slot.plan.dose} · {slot.plan.mealTiming === 'any' ? '' : slot.plan.mealTiming + ' food · '}
            {slot.plan.frequency}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {current ? (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            {STATUS_ICONS[current]}
            <span className="capitalize">{current}</span>
          </span>
        ) : (
          <>
            <button
              onClick={() => handle('taken')}
              className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300 hover:bg-green-500/30"
            >
              ✓ Taken
            </button>
            <button
              onClick={() => handle('skipped')}
              className="rounded-lg bg-white/5 px-3 py-1 text-xs text-slate-400 hover:bg-white/10"
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function DailyTimeline({ slots, onLog, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/5" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 py-10 text-center">
        <Pill className="mx-auto mb-3 h-8 w-8 text-sky-400 opacity-30" />
        <p className="text-sm text-slate-500">No medications scheduled for today</p>
        <p className="mt-1 text-xs text-slate-600">Add a medication or import a prescription above</p>
      </div>
    );
  }

  // Group by slot index
  const groups = new Map<number, TimelineSlot[]>();
  for (const slot of slots) {
    if (!groups.has(slot.slotIndex)) groups.set(slot.slotIndex, []);
    groups.get(slot.slotIndex)!.push(slot);
  }

  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([si, slotList]) => (
        <div key={si}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              {slotList[0].label}
            </span>
            <span className="text-xs text-slate-600">{SLOT_TIMES[si]}</span>
          </div>
          <div className="space-y-2">
            {slotList.map(slot => (
              <PillCard key={`${slot.plan.id}-${slot.slotIndex}`} slot={slot} onLog={onLog} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
