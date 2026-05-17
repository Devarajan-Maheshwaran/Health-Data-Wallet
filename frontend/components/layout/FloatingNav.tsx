'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Home,
  LayoutDashboard,
  FolderHeart,
  Bot,
  ShieldCheck,
  QrCode,
  FileText,
  Github
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderHeart, label: 'Vault', href: '/vault' },
  { icon: Bot, label: 'AI', href: '/ai' },
  { icon: ShieldCheck, label: 'Access', href: '/access' },
  { icon: QrCode, label: 'Emergency', href: '/emergency-qr' },
  { icon: FileText, label: 'Docs', href: '/docs' },
];

export function FloatingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isConnected && pathname !== '/') {
      router.push('/');
    }
  }, [isConnected, pathname, router, mounted]);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-[#111518]/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-2xl shadow-sky-900/20 max-w-full overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavBubble"
                  className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-primary' : ''}`} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
        <div className="w-px h-6 bg-white/10 mx-2" />
        <a
          href="https://github.com/Devarajan-Maheshwaran/Health-Data-Wallet"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </a>
        <div className="w-px h-6 bg-white/10 mx-2" />
        <div className="pointer-events-auto scale-90 origin-right">
          <ConnectButton 
            chainStatus="icon" 
            showBalance={false} 
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} 
          />
        </div>
      </nav>
    </div>
  );
}
