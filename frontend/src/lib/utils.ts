import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatDate(ts: number | string): string {
  return new Date(typeof ts === 'string' ? ts : ts * 1000).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts * 1000
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export const DOCUMENT_TYPE_LABELS: Record<number, string> = {
  0:  'Lab Report',
  1:  'Prescription',
  2:  'Imaging',
  3:  'Discharge Summary',
  4:  'Vaccination',
  5:  'Insurance Policy',
  6:  'Legal Contract',
  7:  'Identity Document',
  8:  'Financial Record',
  9:  'Property Document',
  10: 'Academic Credential',
  11: 'Other',
}

export const DOCUMENT_TYPE_ICONS: Record<number, string> = {
  0: '🧪', 1: '📊', 2: '🧠', 3: '🏥', 4: '💉',
  5: '🛡️', 6: '⚖️', 7: '📌', 8: '💰', 9: '🏠', 10: '🎓', 11: '📄',
}

export const ACCESS_TIER_LABELS = [
  'Emergency Read', 'Record Read', 'Full Read', 'Provider Write',
]
