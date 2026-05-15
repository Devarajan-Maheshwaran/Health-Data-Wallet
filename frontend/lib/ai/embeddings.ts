/**
 * embeddings.ts — Phase 5
 * Semantic embedding using Xenova/all-MiniLM-L6-v2 (~23 MB, ONNX).
 * Vectors are stored in IndexedDB keyed by `${recordId}:${chunkIndex}`.
 */

import { pipeline } from '@xenova/transformers';
import { get, set, del, keys } from 'idb-keyval';

export type EmbeddingVector = number[];

export interface StoredChunk {
  id:         string;
  recordId:   number;
  chunkIndex: number;
  text:       string;
  embedding:  EmbeddingVector;
  docType:    number;
  title:      string;
}

let embedPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

export async function getEmbedder() {
  if (!embedPipeline) {
    embedPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { progress_callback: () => {} }
    );
  }
  return embedPipeline;
}

export async function embed(text: string): Promise<EmbeddingVector> {
  const embedder = await getEmbedder();
  const output   = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export function cosineSim(a: EmbeddingVector, b: EmbeddingVector): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

const STORE_PREFIX = 'medvault:chunk:';

export async function saveChunk(chunk: StoredChunk): Promise<void> {
  await set(`${STORE_PREFIX}${chunk.id}`, chunk);
}

export async function loadAllChunks(): Promise<StoredChunk[]> {
  const allKeys   = await keys();
  const chunkKeys = (allKeys as string[]).filter(k => k.startsWith(STORE_PREFIX));
  const chunks    = await Promise.all(chunkKeys.map(k => get<StoredChunk>(k)));
  return chunks.filter(Boolean) as StoredChunk[];
}

export async function deleteChunksForRecord(recordId: number): Promise<void> {
  const allKeys  = await keys();
  const toDelete = (allKeys as string[]).filter(
    k => k.startsWith(`${STORE_PREFIX}${recordId}:`)
  );
  await Promise.all(toDelete.map(k => del(k)));
}

export async function getChunkCount(): Promise<number> {
  const allKeys = await keys();
  return (allKeys as string[]).filter(k => k.startsWith(STORE_PREFIX)).length;
}

export async function semanticSearch(
  query: string,
  topK = 5,
  minScore = 0.2
): Promise<Array<StoredChunk & { score: number }>> {
  const [queryVec, allChunks] = await Promise.all([embed(query), loadAllChunks()]);
  const scored = allChunks
    .map(c => ({ ...c, score: cosineSim(queryVec, c.embedding) }))
    .filter(c => c.score >= minScore);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
