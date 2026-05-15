/**
 * drugChecker.ts — Phase 5
 * In-browser drug–drug interaction checker.
 * Uses a bundled JSON interaction database (no external API).
 * Source: OpenFDA + DrugBank public dataset (open-licensed subset).
 *
 * For serious interactions, always directs user to a pharmacist/physician.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Severity = 'major' | 'moderate' | 'minor';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: Severity;
  effect: string;
  recommendation: string;
}

export interface CheckResult {
  interactions: DrugInteraction[];
  majorCount: number;
  moderateCount: number;
  minorCount: number;
  hasMajor: boolean;
}

// ─── Interaction Database ────────────────────────────────────────────────────
// Clinically significant pairs — curated common interactions.
// Full production dataset: load from IPFS-hosted JSON, chunked by letter.
const INTERACTIONS: DrugInteraction[] = [
  { drug1: 'warfarin',    drug2: 'aspirin',       severity: 'major',    effect: 'Increased bleeding risk — anticoagulant effect potentiated.',      recommendation: 'Avoid combination. If necessary, monitor INR closely.' },
  { drug1: 'warfarin',    drug2: 'ibuprofen',     severity: 'major',    effect: 'NSAIDs increase anticoagulant effect and GI bleeding risk.',        recommendation: 'Use paracetamol for pain instead. Monitor INR.' },
  { drug1: 'metformin',   drug2: 'alcohol',       severity: 'major',    effect: 'Risk of lactic acidosis, especially with heavy drinking.',           recommendation: 'Advise patient to avoid excessive alcohol.' },
  { drug1: 'lisinopril',  drug2: 'potassium',     severity: 'moderate', effect: 'Both raise serum potassium — risk of hyperkalaemia.',               recommendation: 'Monitor serum potassium. Avoid high-potassium supplements.' },
  { drug1: 'atorvastatin',drug2: 'clarithromycin',severity: 'major',    effect: 'CYP3A4 inhibition raises statin levels → myopathy / rhabdomyolysis.',rec