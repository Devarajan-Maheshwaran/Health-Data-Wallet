'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAccount } from 'wagmi';

export function EmergencyProfilePage() {
  const { address } = useAccount();
  const [profile, setProfile] = useState({
    bloodType: '', allergies: '', medications: '', conditions: '', emergencyContact: '', doctor: '',
  });
  const [saved, setSaved] = useState(false);

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/emergency/${address}`;

  function handleSave() {
    // Phase 3: encrypt + upload to IPFS + call PatientRegistry.updateEmergencyCard()
    setSaved(true);
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-textPrimary">Emergency Profile</h1>
        <p className="text-white/50 text-sm">This card is publicly accessible when someone scans your QR. Only include what you want visible without authentication.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(profile).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-xs text-white/40 capitalize block mb-1">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      value={val}
                      onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
                      placeholder={key === 'bloodType' ? 'e.g. A+' : ''}
                    />
                  </div>
                ))}
                <Button onClick={handleSave} className="w-full mt-2">
                  {saved ? '✅ Saved' : 'Save & Generate QR'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR */}
          <Card className="flex flex-col items-center justify-center text-center">
            <CardHeader><CardTitle>Your Emergency QR</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-2xl inline-block mb-4">
                <QRCodeSVG value={qrUrl} size={180} />
              </div>
              <p className="text-white/40 text-xs break-all">{qrUrl}</p>
              <Button variant="ghost" className="mt-4" onClick={() => window.print()}>Download / Print</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
