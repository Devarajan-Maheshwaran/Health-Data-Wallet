/**
 * model-store.ts
 * Global singleton that tracks AI model download progress.
 * Uses browser CustomEvents so ANY component anywhere can listen
 * without React context prop-drilling.
 *
 * NER model  = 60% of combined weight (85MB / 175MB total)
 * Classifier = 40% of combined weight (90MB / 175MB total)
 */

export type ModelState =
  | 'idle'
  | 'downloading'
  | 'from_cache'
  | 'ready'
  | 'error';

export interface ModelStoreSnapshot {
  nerPct:        number;   // 0-100
  clsPct:        number;   // 0-100
  combinedPct:   number;   // 0-100 weighted
  state:         ModelState;
  fromCache:     boolean;
  errorMessage:  string | null;
}

// ── Internal state ────────────────────────────────────────────────────────
let _nerPct       = 0;
let _clsPct       = 0;
let _nerReady     = false;
let _clsReady     = false;
let _fromCache    = false;
let _state:  ModelState = 'idle';
let _errorMsg: string | null = null;

function combined() {
  return Math.round(_nerPct * 0.6 + _clsPct * 0.4);
}

function emit() {
  if (typeof window === 'undefined') return;
  const snap: ModelStoreSnapshot = {
    nerPct:       _nerPct,
    clsPct:       _clsPct,
    combinedPct:  combined(),
    state:        _state,
    fromCache:    _fromCache,
    errorMessage: _errorMsg,
  };
  window.dispatchEvent(
    new CustomEvent('medvault:ai-progress', { detail: snap })
  );
}

// ── Public update functions (called by ner.ts + classifier.ts) ───────────

export function reportNERProgress(pct: number, fromCache: boolean) {
  _nerPct    = pct;
  _fromCache = _fromCache || fromCache;
  if (_state === 'idle') _state = fromCache ? 'from_cache' : 'downloading';
  emit();
}

export function reportCLSProgress(pct: number, fromCache: boolean) {
  _clsPct    = pct;
  _fromCache = _fromCache || fromCache;
  if (_state === 'idle') _state = fromCache ? 'from_cache' : 'downloading';
  emit();
}

export function reportReady() {
  _nerPct = _clsPct = 100;
  _nerReady = _clsReady = true;
  _state = 'ready';
  _errorMsg = null;
  emit();
}

export function reportError(msg: string) {
  _state    = 'error';
  _errorMsg = msg;
  emit();
}

export function getSnapshot(): ModelStoreSnapshot {
  return {
    nerPct:      _nerPct,
    clsPct:      _clsPct,
    combinedPct: combined(),
    state:       _state,
    fromCache:   _fromCache,
    errorMessage: _errorMsg,
  };
}

export function isReady() {
  return _state === 'ready';
}

// ── Subscribe helper for React components ────────────────────────────────
export function subscribeToModelProgress(
  cb: (snap: ModelStoreSnapshot) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener('medvault:ai-progress', handler);
  return () => window.removeEventListener('medvault:ai-progress', handler);
}
