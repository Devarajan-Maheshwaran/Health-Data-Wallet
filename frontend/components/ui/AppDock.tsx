'use client';

import { useRouter } from 'next/navigation';
import Dock from './Dock';
import { LayoutDashboard, Archive, Bot, Shield, QrCode } from 'lucide-react';

export default function AppDock() {
  const router = useRouter();

  const items = [
    { icon: <LayoutDashboard size={20} />, label: 'Home', onClick: () => router.push('/dashboard') },
    { icon: <Archive size={20} />, label: 'Vault', onClick: () => router.push('/vault') },
    { icon: <Bot size={20} />, label: 'AI Assistant', onClick: () => router.push('/ai') },
    { icon: <Shield size={20} />, label: 'Access Control', onClick: () => router.push('/access') },
    { icon: <QrCode size={20} />, label: 'Emergency QR', onClick: () => router.push('/emergency-qr') },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none flex justify-center">
      <div className="pointer-events-auto">
        <Dock items={items} />
      </div>
    </div>
  );
}
