/**
 * medication.ts — Phase 6
 * Core data model and IndexedDB persistence for the
 * Medication Adherence & Safety Copilot.
 *
 * Two entities live in idb-keyval:
 *   medvault:plan:<id>    → MedicationPlan
 *   medvault:intake:<id>  → IntakeEvent
 *
 * All data stays on-device. No server calls.
 */

import { get, set, del, keys, update } from 'idb-keyval';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Frequency = 'QD' | 'BID' | 'TID' | 'QID' | 'QW' | 'PRN' | 'OTHER';
export type MealTiming = 'before' | 'after' | 'with' | 'any';
export type IntakeStatus = 'taken' | 'skipped' | 'unknown';

export interface MedicationPlan {
  id:            string;         // crypto.randomUUID()
  drugName:      string;         // generic
  brandName?:    string;
  dose:          string;         // e.g. "10 mg"
  frequency:     Frequency;
  timesPerDay:   number;         // 1|2|3|4 derived from frequency
  mealTiming:    MealTiming;
  startDate:     string;         // ISO date YYYY-MM-DD
  endDate?:      string;         // undefined = ongoing
  indication?:   string;         // extracted condition
  prescriber?:   string;
  linkedRecordId?: number;        // vault recordId
  notes?:        string;
  active:        boolean;
  createdAt:     number;         // Date.now()
}

export interface IntakeEvent {
  id:        string;
  planId:    string;
  date:      string;             // YYYY-MM-DD
  slotIndex: number;             // 0-based (morning=0, noon=1, evening=2, night=3)
  status:    IntakeStatus;
  loggedAt:  number;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const PLAN_PREFIX   = 'medvault:plan:';
const INTAKE_PREFIX = 'medvault:intake:';

// ─── MedicationPlan CRUD ──────────────────────────────────────────────────────────

export async function savePlan(plan: MedicationPlan): Promise<void> {
  await set(`${PLAN_PREFIX}${plan.id}`, plan);
}

export async function loadAllPlans(): Promise<MedicationPlan[]> {
  const allKeys = await keys();
  const planKeys = (allKeys as string[]).filter(k => k.startsWith(PLAN_PREFIX));
  const plans = await Promise.all(planKeys.map(k => get<MedicationPlan>(k)));
  return (plans.filter(Boolean) as MedicationPlan[]).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function loadActivePlans(): Promise<MedicationPlan[]> {
  const all = await loadAllPlans();
  const today = new Date().toISOString().split('T')[0];
  return all.filter(p => p.active && (!p.endDate || p.endDate >= today));
}

export async function deletePlan(id: string): Promise<void> {
  await del(`${PLAN_PREFIX}${id}`);
  // also delete all intake events for this plan
  const allKeys = await keys();
  const toDelete = (allKeys as string[]).filter(k =>
    k.startsWith(`${INTAKE_PREFIX}`) && k.includes(id)
  );
  await Promise.all(toDelete.map(k => del(k)));
}

export async function togglePlanActive(id: string): Promise<void> {
  await update(`${PLAN_PREFIX}${id}`, (plan: MedicationPlan | undefined) => {
    if (!plan) return plan as unknown as MedicationPlan;
    return { ...plan, active: !plan.active };
  });
}

// ─── IntakeEvent CRUD ────────────────────────────────────────────────────────────

export async function logIntake(
  planId: string,
  date: string,
  slotIndex: number,
  status: IntakeStatus
): Promise<void> {
  const id = `${planId}:${date}:${slotIndex}`;
  const event: IntakeEvent = { id, planId, date, slotIndex, status, loggedAt: Date.now() };
  await set(`${INTAKE_PREFIX}${id}`, event);
}

export async function loadIntakesForDate(date: string): Promise<IntakeEvent[]> {
  const allKeys = await keys();
  const k = (allKeys as string[]).filter(key =>
    key.startsWith(INTAKE_PREFIX) && key.includes(`:${date}:`)
  );
  const events = await Promise.all(k.map(key => get<IntakeEvent>(key)));
  return events.filter(Boolean) as IntakeEvent[];
}

export async function loadIntakesForPlan(
  planId: string,
  fromDate: string,
  toDate: string
): Promise<IntakeEvent[]> {
  const allKeys = await keys();
  const k = (allKeys as string[]).filter(key =>
    key.startsWith(`${INTAKE_PREFIX}${planId}:`)
  );
  const events = await Promise.all(k.map(key => get<IntakeEvent>(key)));
  return (events.filter(Boolean) as IntakeEvent[]).filter(
    e => e.date >= fromDate && e.date <= toDate
  );
}

// ─── Adherence Metrics ───────────────────────────────────────────────────────────

export interface AdherenceStats {
  planId:        string;
  drugName:      string;
  totalScheduled: number;
  taken:         number;
  skipped:       number;
  unknown:       number;
  adherenceRate: number; // 0–1
}

export async function computeAdherence(
  plan: MedicationPlan,
  days = 30
): Promise<AdherenceStats> {
  const today = new Date();
  const from  = new Date(today);
  from.setDate(from.getDate() - days + 1);
  const fromStr = from.toISOString().split('T')[0];
  const toStr   = today.toISOString().split('T')[0];

  const events = await loadIntakesForPlan(plan.id, fromStr, toStr);
  const totalScheduled = days * plan.timesPerDay;
  const taken   = events.filter(e => e.status === 'taken').length;
  const skipped = events.filter(e => e.status === 'skipped').length;
  const unknown = totalScheduled - taken - skipped;

  return {
    planId:         plan.id,
    drugName:       plan.drugName,
    totalScheduled,
    taken,
    skipped,
    unknown: Math.max(0, unknown),
    adherenceRate:  totalScheduled > 0 ? taken / totalScheduled : 0,
  };
}

// ─── Frequency Helpers ───────────────────────────────────────────────────────────

export function freqToTimesPerDay(freq: Frequency): number {
  const map: Record<Frequency, number> = {
    QD: 1, BID: 2, TID: 3, QID: 4, QW: 1, PRN: 1, OTHER: 1,
  };
  return map[freq];
}

export const SLOT_LABELS = ['Morning', 'Afternoon', 'Evening', 'Night'];
export const SLOT_TIMES  = ['08:00', '13:00', '18:00', '21:00'];

export function slotsForPlan(plan: MedicationPlan): number[] {
  return Array.from({ length: plan.timesPerDay }, (_, i) => i);
}

export function parseFrequency(raw: string): Frequency {
  const s = raw.toLowerCase().replace(/\s/g, '');
  if (s.includes('once') || s === 'od' || s === 'qd' || s.includes('1x'))  return 'QD';
  if (s.includes('twice') || s === 'bd' || s === 'bid' || s.includes('2x')) return 'BID';
  if (s.includes('thrice') || s === 'tid' || s === 'tds' || s.includes('3x')) return 'TID';
  if (s === 'qid' || s.includes('4x')) return 'QID';
  if (s.includes('week'))  return 'QW';
  if (s.includes('prn') || s.includes('needed')) return 'PRN';
  return 'OTHER';
}
