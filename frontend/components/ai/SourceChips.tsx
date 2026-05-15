'use client';

import type { StoredChunk } from '@/lib/ai/embeddings';
import { DOC_TYPES }        from '@/lib/contracts';
import { FileText }         from 'lucide-react';

export function SourceChips({ chunks }: { chunks: Array<StoredChunk & { score: number }> }) {
  if (!chunks.length) return null;
  const seen  = new Set<number>();
  const dedup = chunks.filter(c => { if (seen.has(c.recordId)) return false; seen.add(c.recordId); return true; });
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="text-xs text-slate-500 self-center">Sources:</span>
      {dedup.map(c => (
        <span key={c.id} title={`${DOC_TYPES[c.docType] ?? 'Doc'} — ${(c.score * 100).toFixed(0)}% match`}
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
          <FileText className="h-3 w-3 text-sky-400" />
          {c.title}
          <span className="text-sky-400/70">{(c.score * 100).toFixed(0)}%</span>
        </span>
      ))}
    </div>
  );
}
