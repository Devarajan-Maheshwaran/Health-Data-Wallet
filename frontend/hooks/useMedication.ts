'use client';

/**
 * useMedication.ts — Phase 6
 * Central hook managing all medication state:
 *   - CRUD on MedicationPlan list
 *   - IntakeEvent logging
 *   - Daily timeline computation
 *   - Adherence stats per plan
 *   - Safety radar (continuous interaction scan)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type MedicationPlan,
  type IntakeStatus,
  type AdherenceStats,
  loadActivePlans,
  loadAllPlans,
  savePlan,
  deletePlan,
  togglePlanActive,
  logIntake,
  loadIntakesForDate,
  computeAdherence,
  slotsForPlan,
  SLOT_LABELS,
  freqToTimesPerDay,
} from '@/lib/medication';
import { parsePrescription }  from '@/lib/ai/prescriptionParser';
import { checkInteractions }  from '@/lib/ai/drugChecker';
import type { CheckResult }   from '@/lib/ai/drugChecker';

export interface TimelineSlot {
  slotIndex:  number;
  label:      string;           // 'Morning', 'Afternoon' etc.
  plan:       MedicationPlan;
  status:     IntakeStatus | null; // null = not yet logged
}

export function useMedication() {
  const [plans,      setPlans]      = useState<MedicationPlan[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimelineSlot[]>([]);
  const [radar,      setRadar]      = useState<CheckResult | null>(null);
  const [stats,      setStats]      = useState<AdherenceStats[]>([]);
  const [loading,    setLoading]    = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const refresh = useCallback(async () => {
    setLoading(true);
    const [active, all] = await Promise.all([loadActivePlans(), loadAllPlans()]);
    setPlans(all);

    // Build today's timeline
    const intakes = await loadIntakesForDate(today);
    const slots: TimelineSlot[] = [];
    for (const plan of active) {
      for (const si of slotsForPlan(plan)) {
        const event = intakes.find(e => e.planId === plan.id && e.slotIndex === si);
        slots.push({
          slotIndex: si,
          label:     SLOT_LABELS[si],
          plan,
          status:    event?.status ?? null,
        });
      }
    }
    // Sort by slot index
    slots.sort((a, b) => a.slotIndex - b.slotIndex);
    setTodaySlots(slots);

    // Safety radar
    if (active.length >= 2) {
      const cr = checkInteractions(active.map(p => p.drugName));
      setRadar(cr.interactions.length > 0 ? cr : null);
    } else {
      setRadar(null);
    }

    // Adherence stats (last 30 days)
    const statsList = await Promise.all(active.map(p => computeAdherence(p, 30)));
    setStats(statsList);

    setLoading(false);
  }, [today]);

  useEffect(() => { refresh(); }, [refresh]);

  // Add plan manually
  const addPlan = useCallback(async (draft: Omit<MedicationPlan, 'id' | 'active' | 'createdAt'>) => {
    const plan: MedicationPlan = {
      ...draft,
      id:        crypto.randomUUID(),
      active:    true,
      createdAt: Date.now(),
    };
    await savePlan(plan);
    await refresh();
    return plan;
  }, [refresh]);

  // Import plans from prescription text
  const importFromText = useCallback(async (
    text: string,
    recordId?: number
  ): Promise<MedicationPlan[]> => {
    const drafts = await parsePrescription(text, recordId);
    const saved: MedicationPlan[] = [];
    for (const draft of drafts) {
      const plan: MedicationPlan = {
        ...draft,
        id:        crypto.randomUUID(),
        active:    true,
        createdAt: Date.now(),
      };
      await savePlan(plan);
      saved.push(plan);
    }
    await refresh();
    return saved;
  }, [refresh]);

  // Log a dose
  const logDose = useCallback(async (
    planId: string,
    slotIndex: number,
    status: IntakeStatus
  ) => {
    await logIntake(planId, today, slotIndex, status);
    await refresh();
  }, [today, refresh]);

  const removePlan  = useCallback(async (id: string) => { await deletePlan(id);      await refresh(); }, [refresh]);
  const toggleActive= useCallback(async (id: string) => { await togglePlanActive(id); await refresh(); }, [refresh]);

  return {
    plans, todaySlots, radar, stats, loading,
    addPlan, importFromText, logDose, removePlan, toggleActive, refresh,
  };
}
