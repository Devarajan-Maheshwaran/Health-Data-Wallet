import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import Grainient from '@/components/ui/Grainient';
import AppDock from '@/components/ui/AppDock';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedVault — Self-Sovereign Health Data',
  description: 'Your health data, your wallet, your control. Encrypted decentralised health records powered by BNB Chain.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0F1E] text-white antialiased`}>
        <Grainient />
        <Providers>
          <main className="pb-24">{children}</main>
          <AppDock />
        </Providers>
      </body>
    </html>
  );
}
