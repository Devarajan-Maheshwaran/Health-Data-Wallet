import { useUserStore } from '@/lib/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUserStore();
  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="flex pt-24 md:pt-24">
        <main className="flex-1 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
