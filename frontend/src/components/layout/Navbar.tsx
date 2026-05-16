'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useSiweAuth } from '@/src/hooks/useSiweAuth'
import { Button } from '@/src/components/ui/button'
import { shortenAddress } from '@/src/lib/utils'
import Link from 'next/link'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { isAuthenticated, signIn, signOut, session } = useSiweAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 h-16 border-b border-white/[0.06] backdrop-blur-xl bg-surface/80">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/30">
          M
        </div>
        <span className="font-semibold text-white text-lg tracking-tight">MedVault</span>
        <span className="hidden sm:inline text-xs text-white/30 font-mono ml-1">v0.1</span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {isConnected && !isAuthenticated && (
          <Button size="sm" onClick={signIn}>
            Sign In
          </Button>
        )}
        {isAuthenticated && (
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        )}
        <ConnectButton
          chainStatus="icon"
          accountStatus="avatar"
          showBalance={false}
        />
      </div>
    </nav>
  )
}
