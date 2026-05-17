import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import Grainient from '@/components/ui/Grainient';
import { FloatingNav } from '@/components/layout/FloatingNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });

export const metadata: Metadata = {
  title: 'MedVault — Self-Sovereign Health Data',
  description: 'Your health data, your wallet, your control. Encrypted decentralised health records powered by BNB Chain.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${syne.variable} font-sans bg-[#0f172a] text-slate-100 antialiased overflow-x-hidden w-full max-w-full`}>
        <Grainient />
        <Providers>
          <FloatingNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
