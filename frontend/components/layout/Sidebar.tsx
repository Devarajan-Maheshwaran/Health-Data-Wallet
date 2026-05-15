'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderLock, Users, Bot, QrCode, Stethoscope, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'        },
  { href: '/vault',       icon: FolderLock,      label: 'Records Vault'    },
  { href: '/medication',  icon: Pill,            label: 'Medication'       },
  { href: '/access',      icon: Users,           label: 'Access Manager'   },
  { href: '/ai',          icon: Bot,             label: 'AI Assistant'     },
  { href: '/emergency',   icon: QrCode,          label: 'Emergency Profile'},
  { href: '/provider',    icon: Stethoscope,     label: 'Provider Portal'  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 flex-col glass border-r border-white/5 py-6 px-4 gap-1 z-40">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            pathname === href
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </Link>
      ))}
    </aside>
  );
}
