'use client';

/**
 * EntityCard.tsx — Phase 4
 * Displays AI-extracted biomedical entities grouped by category.
 * Used in VaultPage confirm step before the user encrypts and uploads.
 */

import type { MedicalEntities } from '@/lib/ai/ner';
import { Pill, Stethoscope, FlaskConical, Scissors, Activity, CalendarDays } from 'lucide-react';

const CATEGORY_CONFIG: {
  key: keyof MedicalEntities;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { key: 'diseases',     label: 'Conditions',    icon: Activity,       color: 'text-red-400',    bg: 'bg-red-500/10    border-red-500/20'    },
  { key: 'drugs',        label: 'Medications',   icon: Pill,           color: 'text-sky-400',    bg: 'bg-sky-500/10    border-sky-500/20'    },
  { key: 'symptoms',     label: 'Symptoms',      icon: Stethoscope,    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { key: 'lab_values',   label: 'Lab Values',    icon: FlaskConical,   color: 'text-green-400',  bg: 'bg-green-500/10  border-green-500/20'  },
  { key: 'procedures',   label: 'Procedures',    icon: Scissors,       color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'dates',        label: 'Dates',         icon: CalendarDays,   color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
];

interface Props {
  entities: MedicalEntities;
  compact?: boolean;
}

export function EntityCard({ entities, compact = false }: Props) {
  const hasAny = CATEGORY_CONFIG.some(c => entities[c.key].length > 0);
  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500 italic">
        No medical entities detected in this document.
      </p>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {CATEGORY_CONFIG.map(({ key, label, icon: Icon, color, bg }) => {
        const items = entities[key];
        if (items.length === 0) return null;
        return (
          <div key={key} className={`rounded-xl border p-3 ${bg}`}>
            <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {items.slice(0, compact ? 4 : 10).map(item => (
                <span
                  key={item}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white"
                >
                  {item}
                </span>
              ))}
              {items.length > (compact ? 4 : 10) && (
                <span className="text-xs text-slate-500">+{items.length - (compact ? 4 : 10)} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
