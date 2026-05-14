'use client';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { useCallback, useState } from 'react';
import { useUserStore } from '@/lib/store';

export function useSIWE() {
  const { address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { setAuthenticated, logout } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (!address || !chain) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();

      // 2. Build SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to MedVault — your self-sovereign health data platform.',
        uri: window.location.origin,
        version: '1',
        chainId: chain.id,
        nonce,
      });

      // 3. Sign
      const signature = await signMessageAsync({ message: message.prepareMessage() });

      // 4. Verify on server → sets httpOnly cookie
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.prepareMessage(), signature }),
      });

      if (!verifyRes.ok) throw new Error('Verification failed');
      setAuthenticated(address);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }, [address, chain, signMessageAsync, setAuthenticated]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    logout();
  }, [logout]);

  return { signIn, signOut, isLoading, error };
}
