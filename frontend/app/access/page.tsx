import { AccessPage } from '@/components/access/AccessPage';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-slate-400 text-sm">Loading access control...</div>}>
      <AccessPage />
    </Suspense>
  );
}
