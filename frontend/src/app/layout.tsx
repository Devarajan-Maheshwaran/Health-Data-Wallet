import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'MedVault — Self-Sovereign Health Data',
  description:
    'Your health data, your control. Encrypted, decentralised, wallet-governed.',
  keywords: ['health data', 'blockchain', 'self-sovereign', 'encrypted', 'BNB', 'web3'],
  authors: [{ name: 'MedVault' }],
  openGraph: {
    title: 'MedVault — Self-Sovereign Health Data',
    description: 'Your health data, your control.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0F1E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
