/**
 * pipeline-utils.ts
 * Typed wrapper around @xenova/transformers pipeline() calls.
 *
 * The library exports a massive union overload that makes TypeScript refuse
 * to call pipelines with certain arg combinations (string[], options objects,
 * boolean flags, etc.). This module provides narrow typed wrappers for each
 * task type we use, bypassing the union via a targeted cast.
 *
 * ALL pipeline calls across the codebase should go through these helpers.
 */

let configured = false;

export async function getTransformers() {
  const t = await import('@xenova/transformers');
  if (!configured) {
    t.env.allowLocalModels  = false;
    t.env.useBrowserCache   = true;
    // Ensure Worker context also gets these flags before any pipeline call
    if (typeof self !== 'undefined' && self !== (globalThis as any).window) {
      // We are inside a Web Worker — re-apply explicitly
      t.env.allowLocalModels = false;
      t.env.useBrowserCache  = true;
    }
    // Force single-thread ONNX execution.
    // Without this, the runtime tries SharedArrayBuffer (SAB) for
    // multi-threading, which requires COEP: require-corp. Our app
    // uses 'unsafe-none' to support wallet popups, so SAB is blocked
    // and the runtime HANGS indefinitely waiting for a thread that
    // never spawns. numThreads: 1 disables that entirely.
    if (t.env.backends?.onnx?.wasm) {
      t.env.backends.onnx.wasm.numThreads = 1;
    }
    configured = true;
  }
  return t;
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(
        `[AI] ${label} timed out after ${ms / 1000}s. ` +
        `Check your connection and refresh.`
      )),
      ms
    );
    promise.then(v => { clearTimeout(timer); resolve(v); },
                 e => { clearTimeout(timer); reject(e); });
  });
}

type AnyPipeline = any;

// ── Feature Extraction (embeddings) ─────────────────────────────────────────

export interface FeatureExtractionOptions {
  pooling?: 'none' | 'mean' | 'cls';
  normalize?: boolean;
}

export interface FeatureExtractionOutput {
  data: Float32Array;
}

export type FeatureExtractionPipeline = (
  input: string | string[],
  options?: FeatureExtractionOptions
) => Promise<FeatureExtractionOutput>;

export function asFeatureExtraction(p: AnyPipeline): FeatureExtractionPipeline {
  return p as unknown as FeatureExtractionPipeline;
}

// ── Token Classification (NER) ───────────────────────────────────────────────

export interface TokenClassificationResult {
  entity_group?: string;
  entity?: string;
  word?: string;
  score?: number;
  start?: number;
  end?: number;
}

export type TokenClassificationPipeline = (
  input: string | string[]
) => Promise<TokenClassificationResult[]>;

export function asTokenClassification(p: AnyPipeline): TokenClassificationPipeline {
  return p as unknown as TokenClassificationPipeline;
}

// ── Zero-Shot Classification ─────────────────────────────────────────────────

export interface ZeroShotClassificationOutput {
  labels: string[];
  scores: number[];
}

export type ZeroShotClassificationPipeline = (
  input: string,
  candidateLabels: string[]
) => Promise<ZeroShotClassificationOutput>;

export function asZeroShotClassification(p: AnyPipeline): ZeroShotClassificationPipeline {
  return p as unknown as ZeroShotClassificationPipeline;
}

// ── Text2Text Generation ─────────────────────────────────────────────────────

export interface Text2TextGenerationOptions {
  max_new_tokens?: number;
  temperature?: number;
  do_sample?: boolean;
}

export interface Text2TextGenerationOutput {
  generated_text: string;
}

export type Text2TextGenerationPipeline = (
  input: string,
  options?: Text2TextGenerationOptions
) => Promise<Text2TextGenerationOutput[]>;

export function asText2TextGeneration(p: AnyPipeline): Text2TextGenerationPipeline {
  return p as unknown as Text2TextGenerationPipeline;
}
