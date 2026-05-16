"use client";

import { useState } from 'react';
import { Loader2, Sparkles, PlusCircle, X } from 'lucide-react';
import type { MedicationPlan } from '@/lib/medication';
import { parseFrequency, freqToTimesPerDay } from '@/lib/medication';

type Mode = 'paste' | 'manual';

interface Props {
  onImport: (text: string, recordId?: number) => Promise<MedicationPlan[]>;
  onAdd: (draft: Omit<MedicationPlan, 'id' | 'active' | 'createdAt'>) => Promise<MedicationPlan>;
  onClose: () => void;
}

export function ImportDrawer({ onImport, onAdd, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('paste');
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<MedicationPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [drug, setDrug] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('QD');
  const [meal, setMeal] = useState('any');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const plans = await onImport(text);
      setParsed(plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  const handleManualAdd = async () => {
    if (!drug.trim()) return;
    const f = parseFrequency(freq);
    await onAdd({
      drugName: drug.trim().toLowerCase(),
      dose: dose.trim() || 'see label',
      frequency: f,
      timesPerDay: freqToTimesPerDay(f),
      mealTiming: meal as MedicationPlan['mealTiming'],
      startDate: start,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-t-2xl border-t border-white/10 bg-[#0A0F1E] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Add Medication</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          {(['paste', 'manual'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setParsed(null); setError(null); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                mode === m ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}>
              {m === 'paste' ? 'AI Parse Prescription' : 'Add Manually'}
            </button>
          ))}
        </div>

        {mode === 'paste' && (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste prescription text here..."
              className="h-32 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {!parsed ? (
              <button onClick={handleParse} disabled={!text.trim() || parsing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50">
                {parsing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Parsing with AI...</>
                  : <><Sparkles className="h-4 w-4" /> Extract Medications</>
                }
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-green-400">Found {parsed.length} medication{parsed.length !== 1 ? 's' : ''}</p>
                {parsed.map((p, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    <span className="capitalize font-medium text-white">{p.drugName}</span>
                    {' - '}{p.dose} - {p.frequency} - {p.mealTiming} food
                  </div>
                ))}
                <button onClick={onClose}
                  className="w-full rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white hover:bg-green-600">
                  Save All to Medication List
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-3">
            <input value={drug} onChange={e => setDrug(e.target.value)}
              placeholder="Drug / medicine name (generic)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={dose} onChange={e => setDose(e.target.value)}
                placeholder="Dose (e.g. 500 mg)"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500" />
              <select value={freq} onChange={e => setFreq(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500">
                {['QD','BID','TID','QID','QW','PRN'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={meal} onChange={e => setMeal(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500">
                {['any','before','after','with'].map(m => <option key={m} value={m}>{m} food</option>)}
              </select>
              <input type="date" value={start} onChange={e => setStart(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
            </div>
            <button onClick={handleManualAdd} disabled={!drug.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50">
              <PlusCircle className="h-4 w-4" /> Add Medication
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
