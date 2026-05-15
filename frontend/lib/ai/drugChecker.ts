/**
 * drugChecker.ts — Phase 5
 * In-browser drug–drug interaction checker.
 * 25 clinically significant pairs with alias resolution.
 * No external API — entirely client-side.
 */

export type Severity = 'major' | 'moderate' | 'minor';

export interface DrugInteraction {
  drug1:          string;
  drug2:          string;
  severity:       Severity;
  effect:         string;
  recommendation: string;
}

export interface CheckResult {
  interactions:   DrugInteraction[];
  majorCount:     number;
  moderateCount:  number;
  minorCount:     number;
  hasMajor:       boolean;
}

const INTERACTIONS: DrugInteraction[] = [
  { drug1: 'warfarin',      drug2: 'aspirin',        severity: 'major',    effect: 'Increased bleeding risk — anticoagulant effect potentiated.',       recommendation: 'Avoid combination. Monitor INR closely.' },
  { drug1: 'warfarin',      drug2: 'ibuprofen',      severity: 'major',    effect: 'NSAIDs increase anticoagulant effect and GI bleeding risk.',         recommendation: 'Use paracetamol instead. Monitor INR.' },
  { drug1: 'warfarin',      drug2: 'naproxen',       severity: 'major',    effect: 'NSAID potentiates warfarin — major bleeding risk.',                   recommendation: 'Avoid. Use safer analgesic and monitor INR.' },
  { drug1: 'metformin',     drug2: 'alcohol',        severity: 'major',    effect: 'Risk of lactic acidosis, especially with heavy drinking.',            recommendation: 'Advise patient to avoid excessive alcohol.' },
  { drug1: 'atorvastatin',  drug2: 'clarithromycin', severity: 'major',    effect: 'CYP3A4 inhibition raises statin levels → myopathy / rhabdomyolysis.', recommendation: 'Withhold atorvastatin during clarithromycin course.' },
  { drug1: 'simvastatin',   drug2: 'amlodipine',     severity: 'moderate', effect: 'Amlodipine raises simvastatin exposure ~77% — myopathy risk.',       recommendation: 'Cap simvastatin at 20 mg/day with amlodipine.' },
  { drug1: 'lisinopril',    drug2: 'potassium',      severity: 'moderate', effect: 'Both raise serum potassium — risk of hyperkalaemia.',                recommendation: 'Monitor serum potassium. Avoid potassium supplements.' },
  { drug1: 'lisinopril',    drug2: 'spironolactone', severity: 'moderate', effect: 'Additive hyperkalaemia risk.',                                        recommendation: 'Monitor potassium levels frequently.' },
  { drug1: 'methotrexate',  drug2: 'ibuprofen',      severity: 'major',    effect: 'NSAIDs reduce methotrexate clearance — toxicity risk.',              recommendation: 'Avoid NSAIDs with methotrexate. Use paracetamol.' },
  { drug1: 'methotrexate',  drug2: 'aspirin',        severity: 'major',    effect: 'Aspirin reduces methotrexate excretion — severe toxicity.',           recommendation: 'Avoid combination. Consult rheumatologist.' },
  { drug1: 'clopidogrel',   drug2: 'omeprazole',     severity: 'moderate', effect: 'Omeprazole inhibits CYP2C19 reducing clopidogrel activation.',       recommendation: 'Use pantoprazole instead of omeprazole if needed.' },
  { drug1: 'ssri',          drug2: 'tramadol',       severity: 'major',    effect: 'Risk of serotonin syndrome.',                                         recommendation: 'Avoid combination. Use alternative analgesia.' },
  { drug1: 'fluoxetine',    drug2: 'tramadol',       severity: 'major',    effect: 'Serotonin syndrome risk + reduced tramadol efficacy (CYP2D6).',       recommendation: 'Avoid. Use non-serotonergic analgesia.' },
  { drug1: 'sertraline',    drug2: 'tramadol',       severity: 'major',    effect: 'Serotonin syndrome risk.',                                            recommendation: 'Avoid combination. Consult prescriber.' },
  { drug1: 'amiodarone',    drug2: 'warfarin',       severity: 'major',    effect: 'Amiodarone inhibits warfarin metabolism — bleeding risk.',            recommendation: 'Reduce warfarin dose by 30–50%. Monitor INR weekly.' },
  { drug1: 'digoxin',       drug2: 'amiodarone',     severity: 'major',    effect: 'Amiodarone raises digoxin levels — toxicity risk.',                   recommendation: 'Reduce digoxin dose by 50%. Monitor digoxin levels.' },
  { drug1: 'ciprofloxacin', drug2: 'theophylline',   severity: 'major',    effect: 'Ciprofloxacin inhibits theophylline metabolism — seizure risk.',     recommendation: 'Reduce theophylline dose and monitor levels.' },
  { drug1: 'lithium',       drug2: 'ibuprofen',      severity: 'major',    effect: 'NSAIDs reduce lithium excretion — toxicity risk.',                   recommendation: 'Avoid NSAIDs. Use paracetamol. Monitor lithium levels.' },
  { drug1: 'lithium',       drug2: 'diclofenac',     severity: 'major',    effect: 'NSAID-induced lithium toxicity.',                                     recommendation: 'Avoid. Monitor lithium if combination necessary.' },
  { drug1: 'sildenafil',    drug2: 'nitrates',       severity: 'major',    effect: 'Severe hypotension — potentially fatal.',                            recommendation: 'Absolute contraindication. Never combine.' },
  { drug1: 'levodopa',      drug2: 'metoclopramide', severity: 'moderate', effect: 'Metoclopramide antagonises levodopa dopaminergic effects.',          recommendation: 'Avoid in Parkinson patients. Use domperidone instead.' },
  { drug1: 'phenytoin',     drug2: 'fluconazole',    severity: 'major',    effect: 'Fluconazole inhibits phenytoin metabolism — toxicity.',              recommendation: 'Monitor phenytoin levels. Reduce dose if needed.' },
  { drug1: 'carbamazepine', drug2: 'erythromycin',   severity: 'major',    effect: 'Erythromycin raises carbamazepine levels — toxicity.',               recommendation: 'Use alternative antibiotic. Monitor CBZ levels.' },
  { drug1: 'azithromycin',  drug2: 'amiodarone',     severity: 'major',    effect: 'QTc prolongation — risk of torsades de pointes.',                    recommendation: 'Avoid combination. Monitor ECG if unavoidable.' },
  { drug1: 'metformin',     drug2: 'contrast',       severity: 'major',    effect: 'Risk of lactic acidosis post-contrast in renal impairment.',         recommendation: 'Withhold metformin 48h before/after IV contrast.' },
];

const DRUG_ALIASES: Record<string, string[]> = {
  aspirin:        ['acetylsalicylic acid', 'asa'],
  ibuprofen:      ['advil', 'nurofen', 'brufen'],
  paracetamol:    ['acetaminophen', 'tylenol', 'panadol'],
  metformin:      ['glucophage', 'glumetza'],
  atorvastatin:   ['lipitor'],
  simvastatin:    ['zocor'],
  warfarin:       ['coumadin', 'jantoven'],
  lisinopril:     ['prinivil', 'zestril'],
  fluoxetine:     ['prozac'],
  sertraline:     ['zoloft'],
  amiodarone:     ['cordarone', 'pacerone'],
  digoxin:        ['lanoxin'],
  clarithromycin: ['biaxin'],
  ciprofloxacin:  ['cipro'],
  azithromycin:   ['zithromax'],
  sildenafil:     ['viagra', 'revatio'],
  nitrates:       ['nitroglycerine', 'nitroglycerin', 'isosorbide'],
  omeprazole:     ['prilosec', 'losec'],
  lithium:        ['lithobid', 'eskalith'],
  phenytoin:      ['dilantin'],
  carbamazepine:  ['tegretol'],
  tramadol:       ['ultram', 'tramal'],
  spironolactone: ['aldactone'],
  methotrexate:   ['rheumatrex', 'trexall'],
  levodopa:       ['ldopa', 'sinemet'],
  ssri:           ['fluoxetine', 'sertraline', 'citalopram', 'escitalopram', 'paroxetine'],
};

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveAlias(drug: string): string {
  const n = norm(drug);
  for (const [canonical, aliases] of Object.entries(DRUG_ALIASES)) {
    if (norm(canonical) === n || aliases.some(a => norm(a) === n)) return canonical;
  }
  return n;
}

export function checkInteractions(drugs: string[]): CheckResult {
  const resolved = [...new Set(drugs.map(resolveAlias))];
  const found: DrugInteraction[] = [];

  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const a = resolved[i], b = resolved[j];
      for (const row of INTERACTIONS) {
        const r1 = resolveAlias(row.drug1), r2 = resolveAlias(row.drug2);
        if ((r1 === a && r2 === b) || (r1 === b && r2 === a)) found.push(row);
      }
    }
  }

  // SSRI expansion
  const ssriMembers = DRUG_ALIASES['ssri'];
  const hasSSRI     = resolved.some(d => ssriMembers.includes(d));
  if (hasSSRI && resolved.includes('tramadol')) {
    const alreadyHas = found.some(r => r.drug1 === 'ssri' || r.drug2 === 'ssri');
    const base = INTERACTIONS.find(r => r.drug1 === 'ssri' && r.drug2 === 'tramadol');
    if (!alreadyHas && base) found.push(base);
  }

  const clean = found.filter(Boolean);
  return {
    interactions:   clean,
    majorCount:     clean.filter(r => r.severity === 'major').length,
    moderateCount:  clean.filter(r => r.severity === 'moderate').length,
    minorCount:     clean.filter(r => r.severity === 'minor').length,
    hasMajor:       clean.some(r => r.severity === 'major'),
  };
}
