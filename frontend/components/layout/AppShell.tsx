'use client';
import { useUserStore } from '@/lib/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUserStore();
  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
