import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'MedVault — Self-Sovereign Health Data',
  description: 'Your health data, your wallet, your control. Encrypted, decentralised, AI-powered.',
  keywords: ['health data', 'blockchain', 'privacy', 'medical records', 'web3'],
  openGraph: {
    title: 'MedVault',
    description: 'Self-sovereign health data platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
