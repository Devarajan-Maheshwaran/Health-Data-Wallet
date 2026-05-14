'use client';
import { useEffect, useState } from 'react';
import { Shield, Phone, AlertTriangle } from 'lucide-react';

interface EmergencyData {
  bloodType?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  emergencyContact?: string;
  doctor?: string;
}

export function EmergencyPublicView({ address }: { address: string }) {
  const [data, setData] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from IPFS via PatientRegistry.getProfile(address).emergencyIpfsHash
    // Wired fully in Phase 3 — showing mock for UI preview
    setTimeout(() => {
      setData({ bloodType: 'Loading from chain...', allergies: 'Fetching...', medications: '', conditions: '', emergencyContact: '', doctor: '' });
      setLoading(false);
    }, 1000);
  }, [address]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-white/50 animate-pulse">Loading emergency profile...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-red-950/20 p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-danger" />
        <div>
          <h1 className="text-2xl font-black text-white">Emergency Medical Info</h1>
          <p className="text-white/40 text-xs font-mono">{address.slice(0, 10)}...{address.slice(-8)}</p>
        </div>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Blood Type',        value: data?.bloodType },
          { label: 'Allergies',          value: data?.allergies },
          { label: 'Current Medications',value: data?.medications },
          { label: 'Conditions',         value: data?.conditions },
          { label: 'Emergency Contact',  value: data?.emergencyContact },
          { label: 'Treating Doctor',    value: data?.doctor },
        ].filter((r) => r.value).map((r) => (
          <div key={r.label} className="bg-red-950/30 border border-red-800/30 rounded-2xl p-4">
            <div className="text-red-300/60 text-xs mb-1">{r.label}</div>
            <div className="text-white font-semibold">{r.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Shield className="w-6 h-6 text-white/20 mx-auto mb-1" />
        <p className="text-white/20 text-xs">Secured by MedVault • blockchain-verified</p>
      </div>
    </div>
  );
}
