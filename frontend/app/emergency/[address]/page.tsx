import { EmergencyPublicView } from '@/components/emergency/EmergencyPublicView';

export default function EmergencyPublic({ params }: { params: { address: string } }) {
  return <EmergencyPublicView address={params.address} />;
}
