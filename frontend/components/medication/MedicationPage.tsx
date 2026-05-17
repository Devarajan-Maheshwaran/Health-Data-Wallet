"use client";

/**
 * MedicationPage.tsx — Phase 6
 * Main page for the Medication Adherence & Safety Copilot.
 *
 * Layout (left→right on desktop, stacked on mobile):
 *  LEFT  — DailyTimeline (today's schedule + quick-log)
 *  RIGHT — SafetyRadar, AdherenceCard, VisitPackGenerator
 */

import { useState }              from 'react';
import { CirclePlus, RefreshCw } from 'lucide-react';
import { useMedication }         from '@/hooks/useMedication';
import { DailyTimeline }         from './DailyTimeline';
import { SafetyRadar }           from './SafetyRadar';
import { AdherenceCard }         from './AdherenceCard';
import { VisitPackGenerator }    from './VisitPackGenerator';
import { ImportDrawer }          from './ImportDrawer';

export function MedicationPage() {
  const {
    plans, todaySlots, radar, stats, loading,
    addPlan, importFromText, logDose, removePlan, toggleActive, refresh,
  } = useMedication();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeDrugs = plans.filter(p => p.active).map(p => p.drugName);

  return (
    <div className="min-h-screen bg-[#0A0F1E] pt-16">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Medication Copilot</h1>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans max-w-2xl bg-white/5 border border-white/10 rounded-xl p-3">
              <strong>How to Use:</strong> Track your active medications, schedule doses, and run local drug interaction safety checks. Click 'Add Medication' to define a plan or paste a plain-text clinical note to parse medication schedules automatically. Log your daily doses on the timeline to generate medical visit adherence packs. The Safety Radar will automatically highlight high-risk drug-drug interaction warnings.
            </p>
            <p className="text-xs text-slate-500">
              {plans.filter(p => p.active).length} active medication{plans.filter(p => p.active).length !== 1 ? 's' : ''}
              {' · '}
              {todaySlots.filter(s => s.status === 'taken').length}/{todaySlots.length} doses logged today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh}
              className="rounded-xl border border-white/10 p-2.5 text-slate-400 hover:bg-white/5">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600">
              <CirclePlus className="h-4 w-4" /> Add Medication
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

          {/* LEFT — Daily Timeline */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Today's Schedule — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <DailyTimeline slots={todaySlots} onLog={logDose} loading={loading} />

            {/* All medications list */}
            {plans.length > 0 && (
              <div className="mt-6 space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">All Medications</h2>
                {plans.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium capitalize text-white">{p.drugName}</p>
                      <p className="text-xs text-slate-500">{p.dose} · {p.frequency} · {p.startDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(p.id)}
                        className={`rounded-lg px-2 py-1 text-xs ${
                          p.active
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            : 'bg-white/5 text-slate-500 hover:bg-white/10'
                        }`}>
                        {p.active ? 'Active' : 'Paused'}
                      </button>
                      <button onClick={() => removePlan(p.id)}
                        className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-500 hover:text-red-400">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT — Safety + Adherence + Visit Pack */}
          <aside className="space-y-5">
            <SafetyRadar radar={radar} loading={loading} drugs={activeDrugs} />
            <AdherenceCard stats={stats} />
            <VisitPackGenerator plans={plans} stats={stats} radar={radar} />
          </aside>
        </div>
      </div>

      {drawerOpen && (
        <ImportDrawer
          onImport={importFromText}
          onAdd={addPlan}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
