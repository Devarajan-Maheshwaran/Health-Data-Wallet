'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import QRCode from 'qrcode.react';
import { QrCode, Download, Eye, Plus, Trash2, Shield, Database } from 'lucide-react';
import { supabase, setSupabaseWallet } from '@/lib/supabase';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface CustomField {
  id:    string;
  label: string;
  value: string;
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
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Vault import state
  const [vaultRecords, setVaultRecords] = useState<Array<{
    id: number;
    title: string;
    docType: number;
    texts: string[];
  }>>([]);
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [importingVault, setImportingVault]   = useState(false);
  const [importMsg, setImportMsg]             = useState<{
    text: string; ok: boolean
  } | null>(null);

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
    ...customFields
      .filter(f => f.label.trim() && f.value.trim())
      .map(f => `${f.label}: ${f.value}`),
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
          if (parsed.customFields?.length) {
            setCustomFields(parsed.customFields.map((f: any) => ({
              ...f,
              id: f.id || crypto.randomUUID(),
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
              if (card.customFields?.length) {
                setCustomFields(card.customFields.map((f: any) => ({
                  ...f,
                  id: f.id || crypto.randomUUID(),
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

  const addCustomField = () =>
    setCustomFields(prev => [
      ...prev,
      { id: crypto.randomUUID(), label: '', value: '' },
    ]);

  const removeCustomField = (id: string) =>
    setCustomFields(prev => prev.filter(f => f.id !== id));

  const updateCustomField = (
    id: string,
    key: 'label' | 'value',
    val: string
  ) =>
    setCustomFields(prev =>
      prev.map(f => f.id === id ? { ...f, [key]: val } : f)
    );

  const isValidName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return false;
    return /^[a-zA-Z\s'-]+$/.test(trimmed);
  };

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length === 10;
  };

  const loadVaultRecords = async () => {
    try {
      const { loadAllChunks } = await import('@/lib/ai/embeddings');
      const chunks = await loadAllChunks();
      const map = new Map<number, any>();
      for (const chunk of chunks) {
        if (!map.has(chunk.recordId)) {
          map.set(chunk.recordId, {
            id:      chunk.recordId,
            title:   chunk.title,
            docType: chunk.docType,
            texts:   [chunk.text],
          });
        } else {
          map.get(chunk.recordId).texts.push(chunk.text);
        }
      }
      setVaultRecords(Array.from(map.values()));
    } catch (err) {
      console.error('[Emergency] Failed to load vault records:', err);
    }
  };

  const save = async () => {
    if (!address) return;

    const validContacts = emergencyContacts
      .filter(c => isValidName(c.name) && isValidPhone(c.phone))
      .map(({ id, ...rest }) => rest);

    const cardData = {
      bloodType:      profile.bloodType,
      allergies:      profile.allergies,
      currentMeds:    profile.currentMeds,
      conditions:     profile.conditions,
      treatingDoctor: profile.treatingDoctor,
      customFields:   customFields
        .filter(f => f.label.trim() && f.value.trim())
        .map(({ id, ...rest }) => rest),
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

            {/* ── Custom Fields ─────────────────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400">
                  Additional Medical Fields
                </label>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="flex items-center gap-1 text-xs text-primary
                             hover:text-sky-300 transition-colors font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
              </div>

              {customFields.length === 0 && (
                <p className="text-[11px] text-slate-600 italic">
                  Click "+ Add Field" to store custom info in your QR
                  (e.g. HbA1c, Insurance ID, Organ Donor Status, DNR, ICU Notes).
                </p>
              )}

              {customFields.map(f => (
                <div key={f.id} className="flex items-center gap-2">
                  <input
                    placeholder="Field name (e.g. HbA1c)"
                    value={f.label}
                    onChange={e => updateCustomField(f.id, 'label', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg
                               px-3 py-2 text-white placeholder-white/20 text-xs
                               focus:outline-none focus:border-primary/40"
                  />
                  <input
                    placeholder="Value (e.g. 7.2%)"
                    value={f.value}
                    onChange={e => updateCustomField(f.id, 'value', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg
                               px-3 py-2 text-white placeholder-white/20 text-xs
                               focus:outline-none focus:border-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomField(f.id)}
                    className="text-rose-400/50 hover:text-rose-400 transition-colors
                               shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

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

            {/* ── Import from Vault ─────────────────────────────────────── */}
            <div className="rounded-xl border border-dashed border-sky-500/20 bg-[#0e172a]/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-sky-400" />
                Auto-fill from Vault Records
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Select any AI-processed report already in your Vault.
                Fields are extracted locally from your IndexedDB — nothing
                leaves your device.
              </p>
              <button
                type="button"
                onClick={async () => {
                  if (!showVaultPicker) await loadVaultRecords();
                  setShowVaultPicker(v => !v);
                  setImportMsg(null);
                }}
                className="flex items-center gap-2 w-full rounded-xl border
                           border-sky-500/30 text-sky-400 hover:bg-sky-500/10
                           px-4 py-2.5 text-xs font-semibold transition-all
                           justify-center"
              >
                <Database className="h-3.5 w-3.5" />
                {showVaultPicker ? 'Hide Vault Records' : 'Browse My Vault Records'}
              </button>

              {showVaultPicker && vaultRecords.length === 0 && (
                <p className="text-[11px] text-slate-500 text-center py-2">
                  No processed records found. Upload and process at least one
                  document from the Vault tab first.
                </p>
              )}

              {showVaultPicker && vaultRecords.length > 0 && (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {vaultRecords.map(rec => (
                    <button
                      key={rec.id}
                      type="button"
                      disabled={importingVault}
                      onClick={async () => {
                        setImportingVault(true);
                        setImportMsg(null);
                        try {
                          const fullText   = rec.texts.join(' ');
                          const extracted  = extractFieldsFromText(fullText);

                          setProfile(prev => ({
                            ...prev,
                            bloodType:      extracted.bloodType      || prev.bloodType,
                            allergies:      extracted.allergies      || prev.allergies,
                            currentMeds:    extracted.currentMeds    || prev.currentMeds,
                            conditions:     extracted.conditions     || prev.conditions,
                            treatingDoctor: extracted.treatingDoctor || prev.treatingDoctor,
                          }));

                          // Also auto-fill any custom fields whose label matches text
                          setCustomFields(prev =>
                            prev.map(f => {
                              const val = extractFieldByLabel(f.label, fullText);
                              return val ? { ...f, value: val } : f;
                            })
                          );

                          setImportMsg({
                            text: `✓ Fields imported from "${rec.title}"`,
                            ok:   true,
                          });
                          setShowVaultPicker(false);
                        } catch {
                          setImportMsg({
                            text: 'Failed to read this vault record.',
                            ok:   false,
                          });
                        } finally {
                          setImportingVault(false);
                        }
                      }}
                      className="w-full text-left rounded-xl border border-white/10
                                 bg-white/5 hover:border-sky-500/30 hover:bg-sky-500/5
                                 px-3 py-2.5 transition-all group disabled:opacity-50"
                    >
                      <p className="text-xs font-bold text-white group-hover:text-sky-300
                                    transition-colors line-clamp-1">
                        {rec.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {rec.texts.length} chunk(s) · processed locally
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {importMsg && (
                <p className={`text-xs font-semibold ${importMsg.ok
                  ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {importMsg.text}
                </p>
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
              {customFields
                .filter(f => f.label.trim() && f.value.trim())
                .map(f => (
                  <div key={f.id} className="border-b border-white/5 pb-2">
                    <span className="text-slate-500">{f.label}: </span>
                    <span className="text-white font-medium">{f.value}</span>
                  </div>
                ))
              }
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

function extractFieldsFromText(text: string) {
  const find = (patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) return m[1].trim();
    }
    return '';
  };
  return {
    bloodType: find([
      /blood\s*(?:type|group)\s*[:\-]?\s*([ABO]{1,2}[+-]?)/i,
      /\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/,
    ]),
    allergies: find([
      /allergi(?:es|c\s+to)\s*[:\-]?\s*([^\n.]{3,80})/i,
      /known\s+allergies?\s*[:\-]?\s*([^\n.]{3,80})/i,
      /NKDA/i,
    ]),
    currentMeds: find([
      /(?:current\s+)?medications?\s*[:\-]?\s*([^\n]{5,120})/i,
      /prescribed\s*[:\-]?\s*([^\n]{5,120})/i,
      /Rx\s*[:\-]?\s*([^\n]{5,120})/i,
    ]),
    conditions: find([
      /(?:chronic\s+)?(?:medical\s+)?conditions?\s*[:\-]?\s*([^\n]{5,100})/i,
      /diagnos(?:is|ed\s+with)\s*[:\-]?\s*([^\n]{5,100})/i,
      /history\s+of\s*[:\-]?\s*([^\n]{5,100})/i,
    ]),
    treatingDoctor: find([
      /(?:treating|attending|primary|referring)\s+(?:physician|doctor|dr\.?)\s*[:\-]?\s*([^\n]{3,60})/i,
      /Dr\.?\s+([A-Z][a-zA-Z\s]{2,40})/,
      /physician\s*[:\-]?\s*([^\n]{3,60})/i,
    ]),
  };
}

function extractFieldByLabel(label: string, text: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m   = text.match(new RegExp(`${esc}\\s*[:\\-]?\\s*([^\\n]{3,80})`, 'i'));
  return m?.[1]?.trim() ?? '';
}
