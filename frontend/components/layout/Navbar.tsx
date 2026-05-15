'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldCheck, LayoutDashboard, FolderLock, Users, Bot, QrCode, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vault',     label: 'Vault',     icon: FolderLock },
  { href: '/access',   label: 'Access',    icon: Users },
  { href: '/ai',       label: 'AI',        icon: Bot },
  { href: '/emergency',label: 'Emergency', icon: QrCode },
  { href: '/provider', label: 'Provider',  icon: Building2 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-[#0A0F1E]/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white">
          <ShieldCheck className="h-6 w-6 text-sky-400" />
          <span className="font-bold tracking-tight">MedVault</span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                pathname === href
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Wallet connect */}
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus="avatar"
        />
      </div>
    </nav>
  );
}
