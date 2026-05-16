'use client'

import { useCallback, useEffect } from 'react'
import { useAccount, useSignMessage, useChainId } from 'wagmi'
import { SiweMessage } from 'siwe'
import { useAppStore } from '@/src/lib/store/useAppStore'
import { useQueryClient } from '@tanstack/react-query'

export function useSiweAuth() {
  const { address, isConnected } = useAccount()
  const chainId   = useChainId()
  const { signMessageAsync } = useSignMessage()
  const { session, setSession, clearSession } = useAppStore()
  const queryClient = useQueryClient()

  // Restore session from server cookie on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ session: s }) => {
        if (s && s.address.toLowerCase() === address?.toLowerCase()) {
          setSession(s)
        } else if (s && s.address.toLowerCase() !== address?.toLowerCase()) {
          // Wallet switched — clear stale session
          signOut()
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const signIn = useCallback(async () => {
    if (!address || !chainId) throw new Error('Wallet not connected')

    const message = new SiweMessage({
      domain:    window.location.host,
      address,
      statement: 'Sign in to MedVault. This request will not trigger a blockchain transaction or cost any gas.',
      uri:       window.location.origin,
      version:   '1',
      chainId,
      nonce:     Math.random().toString(36).slice(2),
      issuedAt:  new Date().toISOString(),
    })

    const messageStr = message.prepareMessage()
    const signature  = await signMessageAsync({ message: messageStr })

    const res = await fetch('/api/auth/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: messageStr, signature }),
    })

    if (!res.ok) throw new Error('SIWE verification failed')

    const data = await res.json()
    setSession({ address: data.address, chainId: data.chainId, issuedAt: data.issuedAt })
    queryClient.invalidateQueries()
    return data
  }, [address, chainId, signMessageAsync, setSession, queryClient])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    clearSession()
    queryClient.clear()
  }, [clearSession, queryClient])

  return {
    session,
    isAuthenticated: !!session && isConnected,
    signIn,
    signOut,
  }
}
