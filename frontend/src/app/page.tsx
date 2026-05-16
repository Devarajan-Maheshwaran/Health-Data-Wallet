'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

export default function Home() {
  const router = useRouter()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected, router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="text-center space-y-6 max-w-2xl px-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Med<span className="text-blue-400">Guard</span>
        </h1>
        <p className="text-xl text-slate-300">
          Your decentralized health data wallet — private, secure, and always yours.
        </p>
        <p className="text-slate-400 text-sm">
          Connect your wallet to get started.
        </p>
      </div>
    </main>
  )
}
