import dynamic from 'next/dynamic';

const AIPage = dynamic(
  () => import('@/components/ai/AIPage').then((m) => m.AIPage),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

export default function Page() { return <AIPage />; }
