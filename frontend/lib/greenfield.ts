/**
 * greenfield.ts — Phase 3
 * BNB Greenfield decentralised storage integration via API route wrapper.
 */

export function bucketName(walletAddress: string): string {
  return `medvault-${walletAddress.toLowerCase().slice(2, 18)}`;
}

export function objectName(recordId: number, version: number): string {
  return `record-${recordId}-v${version}.enc`;
}

export async function ensureBucket(
  walletAddress: string,
  signer: { getAddress: () => Promise<string> }
): Promise<void> {
  const formData = new FormData();
  formData.append('action', 'ensureBucket');
  formData.append('walletAddress', walletAddress);
  
  const res = await fetch('/api/greenfield', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('ensureBucket failed');
}

export interface UploadResult {
  objectName: string;
  txHash: string;
}

export async function uploadEncryptedFile(
  encryptedBlob: Uint8Array,
  walletAddress: string,
  recordId: number,
  version: number
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('action', 'upload');
  formData.append('walletAddress', walletAddress);
  formData.append('recordId', recordId.toString());
  formData.append('version', version.toString());
  formData.append('file', new Blob([encryptedBlob as unknown as BlobPart], { type: 'application/octet-stream' }));
  
  const res = await fetch('/api/greenfield', { method: 'POST', body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Upload failed');
  }
  return res.json();
}

export async function downloadEncryptedFile(
  walletAddress: string,
  recId: number,
  version: number
): Promise<ArrayBuffer> {
  const formData = new FormData();
  formData.append('action', 'download');
  formData.append('walletAddress', walletAddress);
  formData.append('recordId', recId.toString());
  formData.append('version', version.toString());
  
  const res = await fetch('/api/greenfield', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Download failed');
  
  return res.arrayBuffer();
}

export async function deleteObject(
  walletAddress: string,
  recId: number,
  version: number
): Promise<void> {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('walletAddress', walletAddress);
  formData.append('recordId', recId.toString());
  formData.append('version', version.toString());
  
  const res = await fetch('/api/greenfield', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Delete failed');
}
