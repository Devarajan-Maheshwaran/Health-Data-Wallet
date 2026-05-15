import { MedicationPage } from '@/components/medication/MedicationPage';

export const metadata = {
  title: 'Medication Copilot — MedVault',
  description: 'Track medications, adherence, and drug interactions — fully on-device.',
};

export default function Page() {
  return <MedicationPage />;
}
