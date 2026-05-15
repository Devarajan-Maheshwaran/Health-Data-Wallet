/**
 * useEncryption.ts — Phase 3
 * React hook that lazily derives and caches the AES key from the connected wallet.
 * Key is stored only in memory (React state) — never persisted to disk/localStorage.
 */

import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { deriveAESKey } from '@/lib/encryption';

export function useEncryption() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);
  const [deriving, setDeriving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deriveKey = useCallback(async () => {
    if (aesKey) return aesKey; // already derived this session
    if (!address) throw new Error('Wallet not connected');
    setDeriving(true);
    setError(null);
    try {
      const key = await deriveAESKey(
        address,
        async (msg: string) => {
          const sig = await signMessageAsync({ message: msg });
          return sig;
        }
      );
      setAesKey(key);
      return key;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Key derivation failed';
      setError(msg);
      throw e;
    } finally {
      setDeriving(false);
    }
  }, [address, aesKey, signMessageAsync]);

  return { aesKey, deriveKey, deriving, error };
}
