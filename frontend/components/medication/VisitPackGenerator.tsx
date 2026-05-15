'use client';

/**
 * VisitPackGenerator.tsx — Phase 6
 * Generates a printable, bilingual (EN/JP) doctor-visit summary.
 * Lists all active medications + adherence + safety radar highlights.
 * Uses only local data. No network call.
 */

import { useState }           from 'react';
import { FileText, Printer }  from 'lucide-react';
import type { MedicationPlan, AdherenceStats } from '@/lib/medication';
import type { CheckResult }   from '@/lib/ai/drugChecker';

type Lang = 'en' | 'jp';

const T = {
  en: {
    title:       'Doctor Visit Summary',
    date:        'Date',
    medications: 'Active Medications',
    drug:        'Drug',
    dose:        'Dose',
    freq:        'Frequency',
    timing:      'Timing',
    since:       'Since',
    adherence:   'Adherence (30d)',
    interactions:'Drug Interactions',
    noInteract:  'No known interactions detected',
    disclaimer:  'Auto-generated from encrypted local records. Always verify with your doctor.',
  },
  jp: {
    title:       '外来受診サマリー',
    date:        '日付',
    medications: '現在の身分証明',
    drug:        '薬品名',
    dose:        '剣形',
    freq:        '投与回数',
    timing:      '食事タイミング',
    since:       '開始日',
    adherence:   '服薬状況（30日）',
    interactions:'薬物相互作用',
    noInteract:  '相互作用は検出されませんでした',
    disclaimer:  '暗号化ローカル記録から自動生成。必ず医師に確認してください。',
  },
};

interface Props {
  plans:  MedicationPlan[];
  stats:  AdherenceStats[];
  radar:  CheckResult | null;
}

export function VisitPackGenerator({ plans, stats, radar }: Props) {
  const [lang, setLang] = useState<Lang>('en');
  const t = T[lang];
  const today = new Date().toLocaleDateString(lang === 'jp' ? 'ja-JP' : 'en-GB');
  const active = plans.filter(p => p.active);

  const handlePrint = () => {
    const printable = document.getElementById('visit-pack-printable');
    if (!printable) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${t.title}</title>
      <style>body{font-family:sans-serif;padding:24px;color:#111}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f5f5}h2{margin-bottom:4px}p.disclaimer{font-size:11px;color:#888;margin-top:24px}</style>
    </head><body>${printable.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Doctor Visit Pack</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['en','jp'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs font-medium ${
                  lang === l ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}>
                {l === 'en' ? 'EN' : '日本語'}
              </button>
            ))}
          </div>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Printable area */}
      <div id="visit-pack-printable" className="space-y-4 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-bold text-white">{t.title}</h2>
          <p className="text-xs text-slate-500">{t.date}: {today}</p>
        </div>

        {/* Medication table */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-400">{t.medications}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  {[t.drug, t.dose, t.freq, t.timing, t.since, t.adherence].map(h => (
                    <th key={h} className="pb-2 pr-4 text-left text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map(p => {
                  const s = stats.find(x => x.planId === p.id);
                  return (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-white capitalize">{p.drugName}{p.brandName ? ` (${p.brandName})` : ''}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.dose}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.frequency}</td>
                      <td className="py-2 pr-4 text-slate-300 capitalize">{p.mealTiming} food</td>
                      <td className="py-2 pr-4 text-slate-300">{p.startDate}</td>
                      <td className="py-2 pr-4">
                        {s ? (
                          <span className={`font-semibold ${
                            s.adherenceRate >= 0.8 ? 'text-green-400' :
                            s.adherenceRate >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {Math.round(s.adherenceRate * 100)}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Safety */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-400">{t.interactions}</h3>
          {!radar || radar.interactions.length === 0 ? (
            <p className="text-xs text-green-400">✓ {t.noInteract}</p>
          ) : (
            <ul className="space-y-1">
              {radar.interactions.map((ix, i) => (
                <li key={i} className={`text-xs ${
                  ix.severity === 'major' ? 'text-red-300' :
                  ix.severity === 'moderate' ? 'text-yellow-300' : 'text-sky-300'
                }`}>
                  • [{ix.severity.toUpperCase()}] {ix.drug1} + {ix.drug2}: {ix.effect}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-slate-600">{t.disclaimer}</p>
      </div>
    </div>
  );
}
