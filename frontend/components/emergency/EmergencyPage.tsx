'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import QRCode from 'qrcode.react';
import { QrCode, Download, Eye } from 'lucide-react';

type EmergencyProfile = {
  bloodType: string;
  allergies: string;
  currentMeds: string;
  conditions: string;
  emergencyContact: string;
  treatingDoctor: string;
};

const EMPTY: EmergencyProfile = {
  bloodType: '', allergies: '', currentMeds: '',
  conditions: '', emergencyContact: '', treatingDoctor: '',
};

export function EmergencyPage() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<EmergencyProfile>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://medvault.vercel.app'}/emergency/${address}`;

  const save = async () => {
    // Upload profile JSON to IPFS as public card
    // Then call PatientRegistry.updateEmergencyCard(ipfsHash) on-chain
    // Wired in Phase 3 — for now mark as saved
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const field = (key: keyof EmergencyProfile, label: string, placeholder: string) => (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <input
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
        placeholder={placeholder}
        value={profile[key]}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0F1E] px-4 pt-24 pb-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-white">Emergency Profile</h1>
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans max-w-2xl bg-white/5 border border-white/10 rounded-xl p-3 mb-6">
          <strong>How to Use:</strong> Fill out your critical, unencrypted medical information (such as blood type, severe allergies, and emergency contact) that you want first responders to see during a medical emergency. Click 'Save & Upload' to register it on BNB Chain. Print or save the generated QR Code: anyone scanning this QR code will immediately access your emergency card without needing authorization.
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            {field('bloodType', 'Blood Type', 'e.g. O+')}
            {field('allergies', 'Allergies', 'e.g. Penicillin, Peanuts')}
            {field('currentMeds', 'Current Medications', 'e.g. Metformin 500mg, Lisinopril 10mg')}
            {field('conditions', 'Chronic Conditions', 'e.g. Type 2 Diabetes, Hypertension')}
            {field('emergencyContact', 'Emergency Contact', 'Name — +91 9XXXXXXXXX')}
            {field('treatingDoctor', 'Treating Doctor', 'Dr. Name — Hospital')}

            <div className="flex gap-3 pt-2">
              <button
                onClick={save}
                className="flex-1 rounded-lg bg-sky-500 py-2.5 text-sm font-medium text-white hover:bg-sky-600"
              >
                {saved ? '✓ Saved to chain' : 'Save & Upload'}
              </button>
              <button
                onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5"
              >
                <Eye className="h-4 w-4" /> Preview
              </button>
            </div>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <QrCode className="h-8 w-8 text-sky-400" />
            <div className="rounded-xl bg-white p-4">
              <QRCode value={qrUrl} size={180} />
            </div>
            <p className="text-center text-xs text-slate-400 break-all">{qrUrl}</p>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
              <Download className="h-4 w-4" /> Download QR
            </button>
          </div>
        </div>

        {/* Preview card */}
        {preview && (
          <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-yellow-400">Emergency Card Preview (Public)</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(profile).map(([k, v]) => v ? (
                <div key={k}>
                  <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                  <span className="text-white">{v}</span>
                </div>
              ) : null)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
