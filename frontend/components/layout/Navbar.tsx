'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Shield } from 'lucide-react';
import { useSIWE } from '@/hooks/useSIWE';
import { useUserStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useUserStore();
  const { signIn, isLoading } = useSIWE();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Shield className="w-6 h-6" />
            <span>MedVault</span>
          </Link>

          {/* Nav links (only when authenticated) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/vault"     className="hover:text-primary transition-colors">Vault</Link>
              <Link href="/access"    className="hover:text-primary transition-colors">Access</Link>
              <Link href="/ai"        className="hover:text-primary transition-colors">AI</Link>
              <Link href="/emergency" className="hover:text-primary transition-colors">Emergency</Link>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isConnected && !isAuthenticated && (
              <Button onClick={signIn} disabled={isLoading} size="sm">
                {isLoading ? 'Signing...' : 'Sign In'}
              </Button>
            )}
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
