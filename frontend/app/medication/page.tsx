import dynamic from 'next/dynamic';

const MedicationPage = dynamic(
  () => import('@/components/medication/MedicationPage').then((m) => m.MedicationPage),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Medication Copilot — MedVault',
  description: 'Track medications, adherence, and drug interactions — fully on-device.',
};

export default function Page() {
  return <MedicationPage />;
}
