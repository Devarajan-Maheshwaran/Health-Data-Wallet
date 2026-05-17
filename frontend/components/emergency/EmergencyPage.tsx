'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import QRCode from 'qrcode.react';
import { QrCode, Download, Eye, Plus, Trash2, Shield, Upload } from 'lucide-react';
import { supabase, setSupabaseWallet } from '@/lib/supabase';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

type EmergencyProfile = {
  bloodType: string;
  allergies: string;
  currentMeds: string;
  conditions: string;
  treatingDoctor: string;
};

const EMPTY: EmergencyProfile = {
  bloodType: '', allergies: '', currentMeds: '',
  conditions: '', treatingDoctor: '',
};

export function EmergencyPage() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<EmergencyProfile>(EMPTY);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' },
    { id: crypto.randomUUID(), name: '', phone: '', relationship: 'spouse' }
  ]);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // HF Import States
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'https://medvault.vercel.app')}/emergency/${address?.toLowerCase()}`;

  const qrText = [
    '🚨 EMERGENCY MEDICAL CARD',
    `Patient: ${typeof window !== 'undefined' ? (localStorage.getItem('medvault_username') || 'Unknown') : 'Unknown'}`,
    '',
    profile.bloodType      ? `Blood Type: ${profile.bloodType}`           : null,
    profile.allergies      ? `⚠️ Allergies: ${profile.allergies}`         : null,
    profile.currentMeds    ? `Medications: ${profile.currentMeds}`        : null,
    profile.conditions     ? `Conditions: ${profile.conditions}`          : null,
    profile.treatingDoctor ? `Doctor: ${profile.treatingDoctor}`          : null,
    '',
    emergencyContacts.filter(c => c.name.trim() && c.phone.trim()).length > 0
      ? 'EMERGENCY CONTACTS:' : null,
    ...emergencyContacts
      .filter(c => c.name.trim() && c.phone.trim())
      .map(c => `${c.name} (${c.relationship}): ${c.phone}`),
    '',
    'Powered by MedVault',
  ].filter(line => line !== null).join('\n');

  useEffect(() => {
    if (!address) return;
    const cleanAddr = address.toLowerCase();

    const loadLocal = () => {
      try {
        const local = localStorage.getItem(`medvault_emergency_${cleanAddr}`);
        if (local) {
          const parsed = JSON.parse(local);
          setProfile({
            bloodType: parsed.bloodType ?? '',
            allergies: parsed.allergies ?? '',
            currentMeds: parsed.currentMeds ?? '',
            conditions: parsed.conditions ?? '',
            treatingDoctor: parsed.treatingDoctor ?? '',
          });
          if (parsed.emergencyContacts && parsed.emergencyContacts.length > 0) {
            setEmergencyContacts(parsed.emergencyContacts.map((c: any) => ({
              id: c.id || crypto.randomUUID(),
              ...c
            })));
          }
          setShowQR(true);
        }
      } catch (err) {
        console.error('Failed to parse local emergency card:', err);
      }
    };

    if (supabase) {
      setSupabaseWallet(address).then(() => {
        supabase.from('profiles').select('emergency_card').eq('wallet_address', cleanAddr).maybeSingle()
          .then(({ data, error }: any) => {
            if (data?.emergency_card && !error) {
              const card = data.emergency_card;
              setProfile({
                bloodType: card.bloodType ?? '',
                allergies: card.allergies ?? '',
                currentMeds: card.currentMeds ?? '',
                conditions: card.conditions ?? '',
                treatingDoctor: card.treatingDoctor ?? '',
              });
              if (card.emergencyContacts && card.emergencyContacts.length > 0) {
                setEmergencyContacts(card.emergencyContacts.map((c: any) => ({
                  id: c.id || crypto.randomUUID(),
                  ...c
                })));
              }
              setShowQR(true);
            } else {
              loadLocal();
            }
          })
          .catch(() => {
            loadLocal();
          });
      }).catch(() => {
        loadLocal();
      });
    } else {
      loadLocal();
    }
  }, [address]);

  const addEmergencyContact = () => {
    setEmergencyContacts(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' }
    ]);
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  };

  const updateContact = (id: string, field: keyof EmergencyContact, value: string) => {
    setEmergencyContacts(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  const isValidName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return false;
    return /^[a-zA-Z\s'-]+$/.test(trimmed);
  };

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length === 10;
  };

  const importFromDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError('');
    setImportSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-medical', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setImportError(data.error ?? 'Extraction failed. Try a clearer document.');
        return;
      }

      const { extracted } = data;

      setProfile(prev => ({
        bloodType:      extracted.bloodType      || prev.bloodType,
        allergies:      extracted.allergies      || prev.allergies,
        currentMeds:    extracted.currentMeds    || prev.currentMeds,
        conditions:     extracted.conditions     || prev.conditions,
        treatingDoctor: extracted.treatingDoctor || prev.treatingDoctor,
      }));

      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 4000);
    } catch (err) {
      setImportError('Network error. Please try again.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    if (!address) return;

    const validContacts = emergencyContacts
      .filter(c => isValidName(c.name) && isValidPhone(c.phone))
      .map(({ id, ...rest }) => rest);

    const cardData = {
      bloodType: profile.bloodType,
      allergies: profile.allergies,
      currentMeds: profile.currentMeds,
      conditions: profile.conditions,
      treatingDoctor: profile.treatingDoctor,
      emergencyContacts: validContacts,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(`medvault_emergency_${address.toLowerCase()}`, JSON.stringify(cardData));

    if (supabase) {
      try {
        await setSupabaseWallet(address);
        const { error } = await supabase.from('profiles').upsert({
          wallet_address: address.toLowerCase(),
          emergency_card: cardData,
          blood_group: profile.bloodType || null,
          emergency_contacts: validContacts,
        });
        if (error) {
          console.error('[MedVault] Supabase save error:', error.message);
        }
      } catch (err) {
        console.error('[MedVault] Supabase emergency card save failed:', err);
      }
    }

    setSaved(true);
    setShowQR(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('emergency-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `medvault_emergency_qr_${address}.png`;
    link.href = url;
    link.click();
  };

  const field = (key: keyof EmergencyProfile, label: string, placeholder: string) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-400">{label}</label>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500 transition-colors"
        placeholder={placeholder}
        value={profile[key]}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  const validContacts = emergencyContacts.filter(c => isValidName(c.name) && isValidPhone(c.phone));
  const hasMinContacts = validContacts.length >= 2;

  return (
    <div className="min-h-screen bg-[#0A0F1E] px-4 pt-24 pb-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-syne">Emergency Profile</h1>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans max-w-2xl bg-white/5 border border-white/10 rounded-xl p-3 mb-6">
            <strong>How to Use:</strong> Fill out your critical, unencrypted medical information (such as blood type, severe allergies, and emergency contacts) that you want first responders to see during a medical emergency. Click <strong>'Save & Upload'</strong> to register. Paramedics scanning this QR code will instantly access your emergency card without needing authorization.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            {field('bloodType', 'Blood Type', 'e.g. O+')}
            {field('allergies', 'Allergies', 'e.g. Penicillin, Peanuts')}
            {field('currentMeds', 'Current Medications', 'e.g. Metformin 500mg, Lisinopril 10mg')}
            {field('conditions', 'Chronic Conditions', 'e.g. Type 2 Diabetes, Hypertension')}
            {field('treatingDoctor', 'Treating Doctor', 'Dr. Name — Hospital')}

            {/* Emergency Contacts */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Emergency Contacts (Minimum 2 Required) *</label>
                <button
                  type="button"
                  onClick={addEmergencyContact}
                  className="flex items-center gap-1 text-xs text-primary hover:text-sky-300 transition-colors font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              {emergencyContacts.map((contact, index) => {
                const showValidationError = (contact.name.trim() && !isValidName(contact.name)) || (contact.phone.trim() && !isValidPhone(contact.phone));
                return (
                  <div key={contact.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Contact {index + 1}
                      </span>
                      {emergencyContacts.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEmergencyContact(contact.id)}
                          className="text-rose-400/60 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Full name"
                        value={contact.name}
                        onChange={e => updateContact(contact.id, 'name', e.target.value)}
                        className={`bg-white/5 border rounded-lg px-3 py-2 text-white placeholder-white/25 focus:outline-none text-xs transition-colors ${
                          contact.name.trim() && !isValidName(contact.name) ? 'border-rose-500/50' : 'border-white/10 focus:border-primary/40'
                        }`}
                      />
                      <input
                        placeholder="10-digit phone"
                        value={contact.phone}
                        onChange={e => updateContact(contact.id, 'phone', e.target.value)}
                        className={`bg-white/5 border rounded-lg px-3 py-2 text-white placeholder-white/25 focus:outline-none text-xs transition-colors ${
                          contact.phone.trim() && !isValidPhone(contact.phone) ? 'border-rose-500/50' : 'border-white/10 focus:border-primary/40'
                        }`}
                      />
                    </div>
                    <select
                      value={contact.relationship}
                      onChange={e => updateContact(contact.id, 'relationship', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-primary/40 text-xs"
                    >
                      <option value="family" className="bg-[#0e1216]">Family</option>
                      <option value="spouse" className="bg-[#0e1216]">Spouse</option>
                      <option value="friend" className="bg-[#0e1216]">Friend</option>
                      <option value="doctor" className="bg-[#0e1216]">Doctor</option>
                      <option value="other" className="bg-[#0e1216]">Other</option>
                    </select>

                    {showValidationError && (
                      <p className="text-[10px] text-rose-400/90 font-medium">
                        * Please enter a valid alphabetical name and a correct 10-digit phone number.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Import from document */}
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400">
                📄 Auto-fill from Medical Document
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Upload a medical report (PDF, image, or text) — AI will extract
                blood type, allergies, medications, conditions and doctor automatically.
              </p>
              <label className={`
                flex items-center justify-center gap-2 w-full
                rounded-xl border px-4 py-3 text-sm font-semibold cursor-pointer
                transition-all
                ${importing
                  ? 'border-sky-500/40 text-sky-400/60 cursor-wait'
                  : 'border-sky-500/40 text-sky-400 hover:bg-sky-500/10'
                }
              `}>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  className="hidden"
                  onChange={importFromDocument}
                  disabled={importing}
                />
                {importing ? (
                  <>
                    <span className="animate-spin">⏳</span> Extracting with AI...
                  </>
                ) : (
                  <>📤 Upload & Extract Fields</>
                )}
              </label>
              {importSuccess && (
                <p className="text-xs text-emerald-400 font-semibold">
                  ✓ Fields auto-filled from document! Review and click Save & Upload.
                </p>
              )}
              {importError && (
                <p className="text-xs text-rose-400 font-medium">{importError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={save}
                disabled={!hasMinContacts}
                className="flex-1 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saved ? '✓ Saved & Uploaded' : 'Save & Upload'}
              </button>
              <button
                onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-all"
              >
                <Eye className="h-4 w-4" /> Preview
              </button>
            </div>
            {!hasMinContacts && (
              <p className="text-[10px] text-amber-400/80 font-medium">
                * Please configure and save at least two valid emergency contacts (with a valid name & 10-digit phone number) to unlock your QR code.
              </p>
            )}
          </div>

          {/* QR Area */}
          <div>
            {showQR ? (
              <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[350px]">
                <QrCode className="h-8 w-8 text-sky-400" />
                <div className="rounded-xl bg-white p-4">
                  <QRCode id="emergency-qr-canvas" value={qrText} size={180} />
                </div>
                <p className="text-center text-xs text-slate-400 break-all font-mono select-all max-w-[280px]">{qrUrl}</p>
                <button
                  onClick={downloadQR}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-all"
                >
                  <Download className="h-4 w-4" /> Download QR
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center min-h-[350px]">
                <QrCode className="h-12 w-12 text-slate-600 animate-pulse" />
                <div className="space-y-2">
                  <h3 className="text-white font-semibold text-sm">QR Code Pending</h3>
                  <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mx-auto">
                    Fill out the fields on the left (including at least 2 valid emergency contacts) and click <strong>'Save & Upload'</strong> to create and reveal your public Emergency QR code.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview card */}
        {preview && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Emergency Card Preview (Public)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(profile).map(([k, v]) => v ? (
                <div key={k} className="border-b border-white/5 pb-2">
                  <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ) : null)}
            </div>

            {validContacts.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-2">
                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Emergency Contacts Preview</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {validContacts.map((c, i) => (
                    <div key={i} className="flex justify-between bg-white/5 rounded-lg p-3 text-xs">
                      <div>
                        <div className="text-white font-bold">{c.name}</div>
                        <div className="text-slate-400 capitalize">{c.relationship}</div>
                      </div>
                      <div className="text-sky-400 font-mono">{c.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
