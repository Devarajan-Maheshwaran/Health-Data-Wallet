'use client';

/**
 * useVaultUpload.ts — Phase 4
 * Top-level upload orchestrator used by VaultPage.
 *
 * Pipeline:
 *   1. Extract text  (PDF.js / Tesseract — via useDocumentAI)
 *   2. NER           (d4data/biomedical-ner-all via Web Worker)
 *   3. Classify      (Xenova/nli-deberta-v3-small via Web Worker)
 *   4. Encrypt       (AES-256-GCM — via useUpload → useEncryption)
 *   5. Upload        (BNB Greenfield — via useUpload)
 *   6. On-chain      (HealthRecordStore.addRecord — via useUpload)
 *   7. Supabase      (record_metadata_cache — via useUpload → /api/metadata/index)
 *   8. IndexedDB     (embed + store chunks for Phase 5 RAG)
 */

import { useState, useCallback } from 'react';
import { useDocumentAI, type DocumentAIResult, type AIProgress } from './useDocumentAI';
import { useUpload, type UploadStatus } from './useUpload';
import { embed } from '@/lib/ai/embeddings';
import { saveChunk } from '@/lib/ai/embeddings';

export type VaultUploadStage =
  | 'idle'
  | 'extracting'    // PDF.js / Tesseract
  | 'ner'           // Biomedical NER
  | 'classifying'   // Zero-shot classifier
  | 'encrypting'    // AES-256-GCM
  | 'uploading'     // Greenfield
  | 'confirming'    // On-chain tx
  | 'embedding'     // IndexedDB vector store (Phase 5 prep)
  | 'done'
  | 'error';

export interface VaultUploadResult {
  cid:        string;
  txHash:     string;
  docType:    number;
  entities:   DocumentAIResult['entities'];
}

export function useVaultUpload() {
  const { processFile, progress: aiProgress, reset: resetAI } = useDocumentAI();
  const { upload, status: uploadStatus }                       = useUpload();

  const [stage, setStage]           = useState<VaultUploadStage>('idle');
  const [aiResult, setAiResult]     = useState<DocumentAIResult | null>(null);
  const [lastResult, setLastResult] = useState<VaultUploadResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Stage 1+2+3: AI pipeline ─────────────────────────────────────────────
  const analyseFile = useCallback(async (file: File): Promise<DocumentAIResult> => {
    setStage('extracting');
    setError(null);
    setAiResult(null);
    setLastResult(null);

    const result = await processFile(file);
    setAiResult(result);
    return result;
  }, [processFile]);

  // ── Stage 4–8: Encrypt + upload (called after user confirms AI result) ────
  const confirmUpload = useCallback(async (
    file: File,
    title: string,
    aiRes: DocumentAIResult,
    overrideDocType?: number
  ): Promise<VaultUploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      const docType = (overrideDocType ?? aiRes.docType) as 0|1|2|3|4|5|6|7|8|9|10|11;

      const aiMetadata = {
        ...aiRes.entities,
        docLabel:   aiRes.docLabel,
        confidence: aiRes.confidence,
        chunkCount: aiRes.chunks.length,
      };

      // Steps 4–7 via useUpload (encrypt → Greenfield → on-chain → Supabase)
      setStage('encrypting');
      const uploadResult = await upload({ file, title, docType, aiMetadata });

      // Step 8: Embed chunks into IndexedDB for Phase 5 RAG
      // recordId is derived from the timestamp used inside useUpload
      setStage('embedding');
      const recordId = Date.now(); // matches the temp ID in useUpload
      for (let i = 0; i < aiRes.chunks.length; i++) {
        const embedding = await embed(aiRes.chunks[i]);
        await saveChunk({
          id:         `${recordId}:${i}`,
          recordId,
          chunkIndex: i,
          text:       aiRes.chunks[i],
          embedding,
          docType,
          title,
        });
      }

      const final: VaultUploadResult = {
        cid:      uploadResult.objectName,
        txHash:   uploadResult.txHash,
        docType,
        entities: aiRes.entities,
      };

      setLastResult(final);
      setStage('done');
      return final;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      setStage('error');
      throw e;
    } finally {
      setIsUploading(false);
    }
  }, [upload]);

  // ── Convenience: single-call upload (no confirm step) ────────────────────
  const upload_direct = useCallback(async (file: File, title: string) => {
    const aiRes = await analyseFile(file);
    return confirmUpload(file, title, aiRes);
  }, [analyseFile, confirmUpload]);

  const reset = useCallback(() => {
    resetAI();
    setStage('idle');
    setAiResult(null);
    setLastResult(null);
    setError(null);
    setIsUploading(false);
  }, [resetAI]);

  // Merge AI progress step into stage
  const effectiveStage: VaultUploadStage =
    isUploading ? (uploadStatus as VaultUploadStage) :
    stage === 'extracting' || stage === 'ner' || stage === 'classifying' ? aiProgress.step as VaultUploadStage :
    stage;

  return {
    // One-shot API (used by VaultPage simple mode)
    upload: upload_direct,
    // Two-shot API (AI confirm flow)
    analyseFile,
    confirmUpload,
    // State
    stage:       effectiveStage,
    aiProgress,
    aiResult,
    lastResult,
    error,
    isUploading,
    reset,
  };
}
