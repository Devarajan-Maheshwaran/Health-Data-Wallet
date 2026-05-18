'use client';

/**
 * AIModelLoader
 * Global floating UI that shows AI model download progress on ALL pages.
 * Mounts in layout.tsx. Self-dismisses 3 seconds after models are ready.
 * Uses model-store.ts event bus — zero prop drilling.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Cpu, AlertCircle } from 'lucide-react';
import {
  subscribeToModelProgress,
  getSnapshot,
  type ModelStoreSnapshot,
} from '@/lib/ai/model-store';

export function AIModelLoader() {
  const [snap, setSnap]       = useState<ModelStoreSnapshot>(getSnapshot());
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Hydrate immediately from current snapshot
    setSnap(getSnapshot());

    // Subscribe to all future updates
    const unsub = subscribeToModelProgress((s) => {
      setSnap(s);

      // Auto-dismiss 3 seconds after models are ready
      if (s.state === 'ready') {
        setTimeout(() => setVisible(false), 3000);
      }
    });

    return unsub;
  }, []);

  // Don't render if already dismissed or never started
  if (dismissed) return null;
  if (snap.state === 'idle') return null;

  const isReady     = snap.state === 'ready';
  const isError     = snap.state === 'error';
  const isFromCache = snap.fromCache && !isReady;
  const pct         = snap.combinedPct;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]
                     w-[min(92vw,420px)] pointer-events-auto"
        >
          <div className={`
            rounded-2xl border backdrop-blur-xl shadow-2xl px-5 py-4
            ${isError
              ? 'bg-rose-950/80  border-rose-500/30'
              : isReady
              ? 'bg-emerald-950/80 border-emerald-500/30'
              : 'bg-[#0f1a2e]/90  border-sky-500/20'}
          `}>

            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {isError ? (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                ) : isReady ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Cpu className="h-4 w-4 text-sky-400 shrink-0 animate-pulse" />
                )}
                <p className={`text-xs font-bold tracking-wide ${
                  isError   ? 'text-rose-300'
                  : isReady ? 'text-emerald-300'
                  :           'text-sky-300'
                }`}>
                  {isError
                    ? 'AI Model Load Failed'
                    : isReady
                    ? snap.fromCache
                      ? '✓ AI Models Ready  (loaded from cache)'
                      : '✓ AI Models Ready'
                    : isFromCache
                    ? 'Loading AI models from browser cache…'
                    : 'Downloading AI models to browser…'}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => { setVisible(false); setDismissed(true); }}
                className="text-slate-500 hover:text-slate-300 text-[11px]
                           transition-colors ml-3 shrink-0"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Progress bar (hide when ready or error) */}
            {!isReady && !isError && (
              <>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-2 rounded-full ${
                      isFromCache ? 'bg-sky-300' : 'bg-sky-500'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>

                {/* Model breakdown */}
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    NER {snap.nerPct}%
                  </span>
                  <span className="text-[10px] font-mono font-bold
                                   text-sky-400">
                    {pct}% combined
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Classifier {snap.clsPct}%
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  {snap.fromCache
                    ? 'Models cached in browser — ready in seconds.'
                    : '~175 MB total (NER 85MB + Classifier 90MB). ' +
                      'Downloaded once, cached permanently in your browser.'}
                </p>
              </>
            )}

            {/* Success message body */}
            {isReady && (
              <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                MedVault AI is fully loaded and ready. You can now upload
                and analyse medical documents. This popup will close in 3s.
              </p>
            )}

            {/* Error body */}
            {isError && (
              <>
                <p className="text-[11px] text-rose-400/80 leading-relaxed mb-2">
                  {snap.errorMessage ??
                    'Could not load AI models. Check your internet connection.'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-[11px] text-sky-400 underline font-semibold"
                >
                  Refresh to retry
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
