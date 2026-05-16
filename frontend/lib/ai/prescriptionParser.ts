/**
 * prescriptionParser.ts — Phase 6
 * Extracts structured MedicationPlan objects from prescription text
 * using the existing NER pipeline (Phase 4) plus regex patterns.
 *
 * Strategy:
 *  1. NER identifies DRUG/CHEMICAL entities in the text.
 *  2. For each drug entity, regex scans the surrounding sentence
 *     for dose, frequency, timing, and duration patterns.
 *  3. Falls back to whole-text scan if no entities found.
 */

import { extractEntities } from './ner';
import {
  type MedicationPlan,
  type Frequency,
  type MealTiming,
  parseFrequency,
  freqToTimesPerDay,
} from '@/lib/medication';

// ─── Patterns ─────────────────────────────────────────────────────────────────────

const DOSE_RE      = /(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|unit|iu|%|tab|cap|puff|drop)s?)/i;
const FREQ_RE      = /\b(once|twice|thrice|od|qd|bd|bid|tid|tds|qid|q\d+h|\dx\/day|\d\s*times?\s*(?:a|per)?\s*day|every\s+\d+\s*h(?:ours?)?|weekly|monthly|prn|as\s+needed)\b/i;
const DURATION_RE  = /\bfor\s+(\d+)\s*(days?|weeks?|months?)\b/i;
const MEAL_RE      = /\b(before|after|with)\s+(?:food|meals?|eating)\b/i;
const DATE_RE      = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;

function extractSentences(text: string): string[] {
  return text.split(/[\n.;]/g).map(s => s.trim()).filter(s => s.length > 5);
}

function parseDuration(sentence: string): string | undefined {
  const m = DURATION_RE.exec(sentence);
  if (!m) return undefined;
  const n    = parseInt(m[1]);
  const unit = m[2].toLowerCase();
  const today = new Date();
  if (unit.startsWith('day'))   today.setDate(today.getDate() + n);
  if (unit.startsWith('week'))  today.setDate(today.getDate() + n * 7);
  if (unit.startsWith('month')) today.setMonth(today.getMonth() + n);
  return today.toISOString().split('T')[0];
}

function parseMealTiming(sentence: string): MealTiming {
  const m = MEAL_RE.exec(sentence);
  if (!m) return 'any';
  const w = m[1].toLowerCase();
  if (w === 'before') return 'before';
  if (w === 'after')  return 'after';
  if (w === 'with')   return 'with';
  return 'any';
}

/**
 * Parses a block of prescription text into zero or more MedicationPlan objects.
 * recordId links back to the vault record it came from.
 */
export async function parsePrescription(
  text: string,
  recordId?: number
): Promise<Omit<MedicationPlan, 'id' | 'active' | 'createdAt'>[]> {
  const results: Omit<MedicationPlan, 'id' | 'active' | 'createdAt'>[] = [];

  // NER pass
  let drugEntities: string[] = [];
  try {
    const entities = await extractEntities(text);
    drugEntities = [
      ...new Set(
        entities.drugs
          .map((d: string) => d.trim().toLowerCase())
          .filter((w: string) => w.length > 3)
      ),
    ];
  } catch {
    // NER failed — fall through to regex-only path
  }

  const sentences = extractSentences(text);

  if (drugEntities.length > 0) {
    for (const drug of drugEntities) {
      // Find sentence(s) mentioning this drug
      const context = sentences.find(s => s.toLowerCase().includes(drug)) ?? text;

      const doseMatch = DOSE_RE.exec(context);
      const freqMatch = FREQ_RE.exec(context);
      const freq: Frequency = freqMatch ? parseFrequency(freqMatch[1]) : 'QD';

      results.push({
        drugName:        drug,
        dose:            doseMatch ? doseMatch[1] : 'see label',
        frequency:       freq,
        timesPerDay:     freqToTimesPerDay(freq),
        mealTiming:      parseMealTiming(context),
        startDate:       new Date().toISOString().split('T')[0],
        endDate:         parseDuration(context),
        linkedRecordId:  recordId,
      });
    }
  } else {
    // Regex-only fallback: scan every sentence for dose+freq pair
    for (const sentence of sentences) {
      const doseMatch = DOSE_RE.exec(sentence);
      const freqMatch = FREQ_RE.exec(sentence);
      if (!doseMatch && !freqMatch) continue;

      // Try to extract a drug name: first capitalized word before the dose
      const words   = sentence.split(/\s+/);
      const drugIdx = doseMatch ? sentence.indexOf(doseMatch[1]) : -1;
      const beforeDose = drugIdx > 0 ? sentence.slice(0, drugIdx) : sentence;
      const capWord = beforeDose.match(/([A-Z][a-zA-Z]{2,})/)?.[1];
      if (!capWord) continue;

      const freq: Frequency = freqMatch ? parseFrequency(freqMatch[1]) : 'QD';
      results.push({
        drugName:       capWord.toLowerCase(),
        dose:           doseMatch ? doseMatch[1] : 'see label',
        frequency:      freq,
        timesPerDay:    freqToTimesPerDay(freq),
        mealTiming:     parseMealTiming(sentence),
        startDate:      new Date().toISOString().split('T')[0],
        endDate:        parseDuration(sentence),
        linkedRecordId: recordId,
      });
    }
  }

  // Deduplicate by drugName
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.drugName)) return false;
    seen.add(r.drugName);
    return true;
  });
}
