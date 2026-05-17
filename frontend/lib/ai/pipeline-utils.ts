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

// Tell transformers.js we are running in the browser and shouldn't use local fs
let configured = false;
export async function getTransformers() {
  const t = await import('@xenova/transformers');
  if (!configured) {
    t.env.allowLocalModels = false;
    t.env.useBrowserCache = true;
    configured = true;
  }
  return t;
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
