/**
 * greenfield.ts — Phase 3
 * BNB Greenfield decentralised storage integration.
 * Files are always encrypted before arriving here — this module only handles
 * bucket creation, object upload, download, and deletion.
 */

import { Client } from '@bnb-chain/greenfield-js-sdk';

const GREENFIELD_RPC = process.env.NEXT_PUBLIC_GREENFIELD_RPC ?? 'https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org';
const GREENFIELD_CHAIN_ID = process.env.NEXT_PUBLIC_GREENFIELD_CHAIN_ID ?? '5600';
const SP_ADDRESS = process.env.NEXT_PUBLIC_SP_ADDRESS ?? '';

export function getGreenfieldClient() {
  return Client.create(GREENFIELD_RPC, GREENFIELD_CHAIN_ID);
}

/** Derives a deterministic bucket name from a wallet address. */
export function bucketName(walletAddress: string): string {
  return `medvault-${walletAddress.toLowerCase().slice(2, 18)}`;
}

/** Object name for a specific record version. */
export function objectName(recordId: number, version: number): string {
  return `record-${recordId}-v${version}.enc`;
}

/**
 * Creates a private Greenfield bucket for a newly registered patient.
 * Safe to call multiple times — checks existence first.
 */
export async function ensureBucket(
  walletAddress: string,
  signer: { getAddress: () => Promise<string> }
): Promise<void> {
  const client = getGreenfieldClient();
  const name = bucketName(walletAddress);

  try {
    await client.bucket.headBucket(name);
    // Bucket already exists
    return;
  } catch {
    // Bucket doesn't exist — create it
  }

  await (client.bucket as any).createBucket({
    bucketName: name,
    creator: walletAddress,
    visibility: 'VISIBILITY_TYPE_PRIVATE',
    primarySpAddress: SP_ADDRESS,
    paymentAddress: walletAddress,
  });
}

export interface UploadResult {
  objectName: string;
  txHash: string;
}

/**
 * Uploads an encrypted blob to Greenfield.
 * @param encryptedBlob  The packed IV+ciphertext Uint8Array from packEncryptedBlob()
 * @param walletAddress  Owner's wallet address
 * @param recordId       On-chain record ID
 * @param version        Version number
 */
export async function uploadEncryptedFile(
  encryptedBlob: Uint8Array,
  walletAddress: string,
  recordId: number,
  version: number
): Promise<UploadResult> {
  const client = getGreenfieldClient();
  const bucket = bucketName(walletAddress);
  const objName = objectName(recordId, version);
  const body = new Blob([encryptedBlob as unknown as BlobPart], { type: 'application/octet-stream' });

  // Calculate checksums required by Greenfield
  const { RedundancyType } = await import('@bnb-chain/greenfield-js-sdk');
  const checksums = await (client.object as any).computeHashRoots(encryptedBlob.buffer);

  const createTx = await (client.object as any).createObject({
    bucketName: bucket,
    objectName: objName,
    creator: walletAddress,
    visibility: 'VISIBILITY_TYPE_PRIVATE',
    contentType: 'application/octet-stream',
    redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
    payloadSize: BigInt(encryptedBlob.byteLength) as any,
    expectChecksums: checksums,
  });

  await (client.object as any).putObject({
    bucketName: bucket,
    objectName: objName,
    body,
    txnHash: (createTx as any).transactionHash,
  });

  return { objectName: objName, txHash: (createTx as any).transactionHash };
}

/**
 * Downloads an encrypted blob from Greenfield.
 * The caller is responsible for decryption.
 */
export async function downloadEncryptedFile(
  walletAddress: string,
  recId: number,
  version: number
): Promise<ArrayBuffer> {
  const client = getGreenfieldClient();
  const bucket = bucketName(walletAddress);
  const objName = objectName(recId, version);

  const res = await (client.object as any).getObject({
    bucketName: bucket,
    objectName: objName,
  });

  // res.body is a ReadableStream or Blob depending on SDK version
  if (res.body instanceof Blob) return res.body.arrayBuffer();
  // ReadableStream fallback
  const reader = (res.body as unknown as ReadableStream).getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.byteLength, 0);
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength; }
  return combined.buffer;
}

/** Deletes an object from Greenfield (soft-delete on-chain, hard-delete in storage). */
export async function deleteObject(
  walletAddress: string,
  recId: number,
  version: number
): Promise<void> {
  const client = getGreenfieldClient();
  await client.object.deleteObject({
    bucketName: bucketName(walletAddress),
    objectName: objectName(recId, version),
    operator: walletAddress,
  });
}
