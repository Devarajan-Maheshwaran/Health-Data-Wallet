'use client';

/**
 * AIWarmupTrigger
 * Invisible component mounted in layout.tsx.
 * Triggers model warmup on every page load immediately,
 * so models start downloading the moment the app opens —
 * not when the user reaches the Vault page.
 * Uses dynamic import so it never blocks SSR or initial render.
 */

import { useEffect } from 'react';

export function AIWarmupTrigger() {
  useEffect(() => {
    // Only run in browser, non-blocking
    if (typeof window === 'undefined') return;

    // Small delay so wallet + initial UI hydration takes priority
    const timer = setTimeout(() => {
      import('@/hooks/useDocumentAI')
        .then(m => m.warmupModels())
        .catch(() => {
          // model-store.ts reportError() is called internally
        });
    }, 1500); // 1.5s delay — lets wallet connect first

      return () => clearTimeout(timer);
  }, []);

  return null; // renders nothing
}
