'use client';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useUserStore } from '@/lib/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUserStore();
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="flex pt-16">
        {isAuthenticated && <Sidebar />}
        <main className={`flex-1 ${isAuthenticated ? 'ml-0 md:ml-64' : ''} p-6`}>
          {children}
        </main>
      </div>
    </div>
  );
}
