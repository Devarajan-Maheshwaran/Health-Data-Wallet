import nextDynamic from 'next/dynamic';

const VaultPage = nextDynamic(
  () => import('@/components/vault/VaultPage').then((m) => m.VaultPage),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

export default function Page() { return <VaultPage />; }
