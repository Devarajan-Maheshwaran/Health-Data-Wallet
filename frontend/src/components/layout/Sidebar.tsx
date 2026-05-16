'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import { useAppStore } from '@/src/lib/store/useAppStore'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',       icon: '🏠' },
  { href: '/vault',      label: 'Records Vault',   icon: '🗂️' },
  { href: '/access',     label: 'Access Manager',  icon: '🔐' },
  { href: '/ai',         label: 'AI Assistant',    icon: '🤖' },
  { href: '/emergency',  label: 'Emergency Card',  icon: '🏥' },
  { href: '/provider',   label: 'Provider Portal', icon: '👨\u200d⚕️' },
]

export function Sidebar() {
  const pathname     = usePathname()
  const sidebarOpen  = useAppStore((s: any) => s.sidebarOpen)

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 flex flex-col py-4 border-r border-white/[0.06] bg-surface/60 backdrop-blur-xl transition-all duration-300',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary-500/15 text-primary-500 border border-primary-500/20'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/90'
              )}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Version badge */}
      {sidebarOpen && (
        <div className="px-4 py-3">
          <p className="text-xs text-white/20 font-mono">MedVault v0.1</p>
          <p className="text-xs text-white/15">BSC Testnet</p>
        </div>
      )}
    </aside>
  )
}
