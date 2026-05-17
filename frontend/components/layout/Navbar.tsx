'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/vault',     label: 'Vault' },
    { href: '/ai',        label: 'AI Assistant' },
    { href: '/access',    label: 'Access Control' },
    { href: '/emergency', label: 'Emergency QR' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-base font-bold text-primary">
          <Shield className="w-5 h-5" />
          MedVault
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === href
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <ConnectButton showBalance={false} />
    </header>
  );
}
