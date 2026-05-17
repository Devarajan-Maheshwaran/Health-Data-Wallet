/**
 * generator.ts — Phase 5
 * In-browser medical Q&A using Xenova/LaMini-Flan-T5-248M (~248 MB, ONNX).
 * Generates answers from retrieved context chunks (RAG pattern).
 * Runs 100% in-browser via Transformers.js WASM.
 */

import type { StoredChunk } from './embeddings';
import { asText2TextGeneration, getTransformers } from './pipeline-utils';

let generatorPipeline: any = null;

export async function getGenerator() {
  if (!generatorPipeline) {
    const { pipeline } = await getTransformers();
    generatorPipeline = await pipeline(
      'text2text-generation',
      'Xenova/LaMini-Flan-T5-248M',
      { progress_callback: () => {} }
    );
  }
  return generatorPipeline;
}

export function buildRAGPrompt(question: string, chunks: StoredChunk[]): string {
  const MAX_CONTEXT = 2000;
  let context = '';
  for (const chunk of chunks) {
    const candidate = context
      ? context + `\n[${chunk.title}]\n` + chunk.text
      : `[${chunk.title}]\n` + chunk.text;
    if (candidate.length > MAX_CONTEXT) break;
    context = candidate;
  }

  if (!context.trim()) {
    return `Answer the following medical question concisely: ${question}`;
  }

  return (
    `You are a helpful medical assistant. Answer based ONLY on the patient records below.\n` +
    `Be concise. If the answer is not in the records, say "Not found in your records.".\n\n` +
    `PATIENT RECORDS:\n${context}\n\n` +
    `QUESTION: ${question}\n` +
    `ANSWER:`
  );
}

export interface GenerateOptions {
  maxNewTokens?: number;
  temperature?:  number;
}

export async function generateAnswer(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<string> {
  const raw = await getGenerator();
  const gen = asText2TextGeneration(raw);
  const result = await gen(prompt, {
    max_new_tokens: opts.maxNewTokens ?? 180,
    temperature:    opts.temperature  ?? 0.3,
    do_sample:      false,
  });
  return result?.[0]?.generated_text?.trim() ?? 'Unable to generate an answer.';
}

export async function ragAnswer(
  question: string,
  chunks: StoredChunk[],
  opts?: GenerateOptions
): Promise<string> {
  const prompt = buildRAGPrompt(question, chunks);
  return generateAnswer(prompt, opts);
}
