/**
 * Public emergency card — no wallet needed to view.
 * Scanned via QR code by paramedics / emergency contacts.
 */

import { notFound } from 'next/navigation';

async function getEmergencyCard(address: string) {
  try {
    // In production: fetch from PatientRegistry.getProfile() via RPC
    // then fetch the IPFS hash from a public gateway
    // For now return null to show the not-found state
    return null;
  } catch {
    return null;
  }
}

export default async function EmergencyCardPage({ params }: { params: { address: string } }) {
  const card = await getEmergencyCard(params.address);

  return (
    <div className="min-h-screen bg-red-950 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-red-400" />
          <h1 className="text-xl font-bold text-white">EMERGENCY HEALTH CARD</h1>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur">
          <p className="mb-4 text-xs font-mono text-red-300">{params.address}</p>
          {card ? (
            <pre className="text-sm text-white">{JSON.stringify(card, null, 2)}</pre>
          ) : (
            <p className="text-slate-300 text-sm">
              Emergency profile not yet configured by this wallet owner.<br />
              Contact the person directly for medical information.
            </p>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-red-400">Powered by MedVault · medvault.vercel.app</p>
      </div>
    </div>
  );
}
