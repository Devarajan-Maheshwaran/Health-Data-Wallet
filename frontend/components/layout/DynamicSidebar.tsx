'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderHeart, Bot, ShieldCheck, QrCode, LogOut, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderHeart, label: 'Medical Vault', href: '/vault' },
  { icon: Bot, label: 'AI Assistant', href: '/ai' },
  { icon: ShieldCheck, label: 'Access Control', href: '/access' },
  { icon: QrCode, label: 'Emergency QR', href: '/emergency-qr' },
];

export function DynamicSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#111518]/90 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-teal-400" />
          <span className="font-bold text-lg tracking-tight">MedVault</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white transition">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#111518]/80 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
            <span className="font-black text-xl tracking-tight text-white">MedVault</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 relative">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group ${
                  isActive ? 'text-teal-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-teal-400/10 rounded-xl"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 z-10 ${isActive ? 'text-teal-400' : 'group-hover:text-teal-400 transition-colors'}`} />
                <span className="font-medium z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
      
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
