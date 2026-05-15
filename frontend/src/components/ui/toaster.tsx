'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
}

// Simple in-memory event bus for toasts
const listeners: Array<(t: Toast) => void> = []

export function toast(type: ToastType, title: string, description?: string) {
  const id = Math.random().toString(36).slice(2)
  const t: Toast = { id, type, title, description }
  listeners.forEach((l) => l(t))
}

const COLORS: Record<ToastType, string> = {
  success: 'border-success/40 bg-success/10',
  error:   'border-danger/40 bg-danger/10',
  warning: 'border-warning/40 bg-warning/10',
  info:    'border-primary-500/40 bg-primary-500/10',
}
const ICONS: Record<ToastType, string> = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000)
    }
    listeners.push(handler)
    return () => { const i = listeners.indexOf(handler); if (i > -1) listeners.splice(i, 1) }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'glass-card border p-4 animate-slide-up flex items-start gap-3',
            COLORS[t.type]
          )}
        >
          <span className="text-lg">{ICONS[t.type]}</span>
          <div>
            <p className="text-white font-medium text-sm">{t.title}</p>
            {t.description && <p className="text-white/60 text-xs mt-0.5">{t.description}</p>}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-auto text-white/40 hover:text-white/80 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
