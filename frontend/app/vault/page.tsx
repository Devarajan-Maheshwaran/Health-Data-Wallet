import dynamic from 'next/dynamic';

const VaultPage = dynamic(
  () => import('@/components/vault/VaultPage').then((m) => m.VaultPage),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

export default function Page() { return <VaultPage />; }
