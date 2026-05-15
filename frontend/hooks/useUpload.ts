/**
 * useUpload.ts — Phase 3
 * Orchestrates the full upload pipeline:
 * 1. Encrypt file in-browser (AES-256-GCM)
 * 2. Upload encrypted blob to BNB Greenfield
 * 3. Call HealthRecordStore.addRecord() with the object CID
 * 4. Cache AI-extracted metadata to Supabase
 */

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { keccak256, toHex, toBytes } from 'viem';
import { encryptFile, packEncryptedBlob } from '@/lib/encryption';
import { uploadEncryptedFile, ensureBucket } from '@/lib/greenfield';
import { HEALTH_RECORD_STORE_ABI, HEALTH_RECORD_STORE_ADDRESS } from '@/lib/contracts';
import { useEncryption } from './useEncryption';

export type DocumentType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface UploadParams {
  file: File;
  docType: DocumentType;
  title: string;
  aiMetadata?: Record<string, unknown>; // NER output JSON
  recordId?: number; // if updating existing record
}

export type UploadStatus = 'idle' | 'encrypting' | 'uploading' | 'confirming' | 'done' | 'error';

export function useUpload() {
  const { address } = useAccount();
  const { deriveKey } = useEncryption();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const upload = useCallback(async (params: UploadParams) => {
    if (!address) throw new Error('Wallet not connected');
    setStatus('idle');
    setError(null);
    setTxHash(null);

    try {
      // 1. Derive AES key (prompts wallet signature once per session)
      const aesKey = await deriveKey();

      // 2. Encrypt file
      setStatus('encrypting');
      const { ciphertext, iv, mimeType } = await encryptFile(params.file, aesKey);
      const packed = packEncryptedBlob(ciphertext, iv);

      // 3. Ensure Greenfield bucket exists
      await ensureBucket(address, { getAddress: async () => address });

      // 4. Determine record ID for versioning
      const recordId = params.recordId ?? Date.now(); // contract uses auto-increment; this is a temp local ID
      const version = 1; // for new records

      // 5. Upload encrypted blob
      setStatus('uploading');
      const { objectName } = await uploadEncryptedFile(packed, address, recordId, version);

      // 6. Hash the AI metadata for on-chain storage
      const metadataJson = JSON.stringify(params.aiMetadata ?? {});
      const metadataHash = keccak256(toHex(toBytes(metadataJson)));

      // 7. Write to HealthRecordStore on-chain
      setStatus('confirming');
      const hash = await writeContractAsync({
        address: HEALTH_RECORD_STORE_ADDRESS,
        abi: HEALTH_RECORD_STORE_ABI,
        functionName: 'addRecord',
        args: [params.docType, params.title, objectName, metadataHash],
      });
      setTxHash(hash);

      // 8. Cache metadata to Supabase for fast off-chain queries
      await fetch('/api/metadata/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientAddress: address,
          objectName,
          documentType: params.docType,
          aiExtracted: params.aiMetadata,
        }),
      });

      setStatus('done');
      return { objectName, txHash: hash };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      setStatus('error');
      throw e;
    }
  }, [address, deriveKey, writeContractAsync]);

  return { upload, status, error, txHash };
}
