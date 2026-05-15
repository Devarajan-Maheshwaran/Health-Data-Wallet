/**
 * encryption.ts — Phase 3
 * AES-256-GCM key derivation from wallet signature (EIP-191 → keccak256 → HKDF → AES key)
 * Files are encrypted in-browser before any upload. No plaintext ever leaves the device.
 */

import { keccak256, toBytes } from 'viem';

const MEDVAULT_MESSAGE = (address: string) =>
  `MedVault encryption key derivation\nWallet: ${address}\nNonce: medvault-v1`;

/**
 * Derives a deterministic AES-256-GCM CryptoKey from a wallet signature.
 * Same wallet always produces the same key — no password needed.
 */
export async function deriveAESKey(walletAddress: string, signMessage: (msg: string) => Promise<string>): Promise<CryptoKey> {
  const message = MEDVAULT_MESSAGE(walletAddress);
  const signature = await signMessage(message);

  // keccak256(signature) → raw 32 bytes
  const sigHash = keccak256(signature as `0x${string}`);
  const rawBytes = toBytes(sigHash);

  // Import as HKDF key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    rawBytes,
    'HKDF',
    false,
    ['deriveKey']
  );

  // Derive AES-256-GCM key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16),
      info: new TextEncoder().encode('medvault-aes'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

/** Encrypts a File object with AES-256-GCM. Returns ciphertext + IV. */
export async function encryptFile(
  file: File,
  aesKey: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array; originalName: string; mimeType: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, fileBuffer);
  return { ciphertext, iv, originalName: file.name, mimeType: file.type };
}

/** Decrypts an ArrayBuffer with AES-256-GCM using the stored IV. */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  aesKey: CryptoKey,
  mimeType: string
): Promise<File> {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
  return new File([plaintext], 'decrypted', { type: mimeType });
}

/**
 * Combines IV + ciphertext into a single uploadable blob.
 * Format: [12 bytes IV][ciphertext...]
 */
export function packEncryptedBlob(ciphertext: ArrayBuffer, iv: Uint8Array): Uint8Array {
  const packed = new Uint8Array(12 + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), 12);
  return packed;
}

/** Unpacks IV and ciphertext from a packed encrypted blob. */
export function unpackEncryptedBlob(packed: ArrayBuffer): { iv: Uint8Array; ciphertext: ArrayBuffer } {
  const bytes = new Uint8Array(packed);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12).buffer;
  return { iv, ciphertext };
}

/**
 * ECIES-style: encrypt the patient's raw AES key bytes for a provider.
 * Uses MetaMask eth-sig-util x25519-xsalsa20-poly1305.
 * Returns a JSON string safe to store on Greenfield alongside the record.
 */
export async function encryptAESKeyForProvider(
  rawAesKeyBytes: Uint8Array,
  providerEncryptionPublicKey: string
): Promise<string> {
  // Dynamic import to avoid SSR issues
  const { encrypt } = await import('@metamask/eth-sig-util');
  const encrypted = encrypt({
    publicKey: providerEncryptionPublicKey,
    data: JSON.stringify({ key: Array.from(rawAesKeyBytes) }),
    version: 'x25519-xsalsa20-poly1305',
  });
  return JSON.stringify(encrypted);
}
