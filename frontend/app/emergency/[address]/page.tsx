import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Shield, AlertTriangle, Phone } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getEmergencyCard(address: string) {
  try {
    const sb = createClient(supabaseUrl, supabaseKey);
    const { data } = await sb
      .from('profiles')
      .select('emergency_card, display_name')
      .eq('wallet_address', address.toLowerCase())
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export default async function EmergencyCardPage({ params }: { params: { address: string } }) {
  const result = await getEmergencyCard(params.address);
  const card = result?.emergency_card as any;
  const name = result?.display_name;

  const fields = [
    { label: 'Blood Type',           value: card?.bloodType },
    { label: 'Allergies',            value: card?.allergies },
    { label: 'Current Medications',  value: card?.currentMeds },
    { label: 'Chronic Conditions',   value: card?.conditions },
    { label: 'Emergency Contact',    value: card?.emergencyContact },
    { label: 'Treating Doctor',      value: card?.treatingDoctor },
  ].filter(f => f.value);

  return (
    <div className="min-h-screen bg-red-950 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold text-white">EMERGENCY HEALTH CARD</h1>
            {name && <p className="text-red-300 text-sm font-semibold">{name}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur space-y-4">
          <p className="text-xs font-mono text-red-400 break-all">{params.address}</p>

          {fields.length > 0 ? (
            fields.map(f => (
              <div key={f.label} className="border-b border-red-800/30 pb-3 last:border-0 last:pb-0">
                <div className="text-red-300/60 text-xs mb-1 uppercase tracking-wider">{f.label}</div>
                <div className="text-white font-semibold text-sm">{f.value}</div>
              </div>
            ))
          ) : (
            <p className="text-slate-300 text-sm">
              Emergency profile not yet configured by this wallet owner.<br />
              Contact the person directly for medical information.
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Shield className="h-3 w-3 text-red-400/50" />
          <p className="text-center text-xs text-red-400/50">Powered by MedVault · medvault.vercel.app</p>
        </div>
      </div>
    </div>
  );
}
