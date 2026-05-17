'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { supabase, setSupabaseWallet } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export function OnboardingSheet() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Identity, Step 2: Contact Details

  // Step 1 fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialisation, setSpecialisation] = useState('');
  const [hospital, setHospital] = useState('');
  const [medReg, setMedReg] = useState('');

  // Step 2 fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [blood, setBlood] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' }
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;
    const cleanAddr = address.toLowerCase();

    const check = async () => {
      if (supabase) {
        await setSupabaseWallet(address);
        const { data } = await supabase
          .from('profiles')
          .select('wallet_address')
          .eq('wallet_address', cleanAddr)
          .maybeSingle();
        if (data) return; // existing user — AuthGate handles redirect
      } else {
        const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
        if (local[cleanAddr]) return;
      }
      setShow(true);
    };

    check();
  }, [isConnected, address]);

  function addEmergencyContact() {
    setEmergencyContacts(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' }
    ]);
  }

  function removeEmergencyContact(id: string) {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  }

  function updateContact(id: string, field: keyof EmergencyContact, value: string) {
    setEmergencyContacts(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (role === 'doctor' && (!specialisation.trim() || !hospital.trim())) return;
    setStep(2);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setSaving(true);
    const cleanAddr = address.toLowerCase();

    // Filter out empty emergency contacts
    const validContacts = emergencyContacts
      .filter(c => c.name.trim() && c.phone.trim())
      .map(({ id, ...rest }) => rest);

    // Build emergency_card JSONB (for QR scan page)
    const emergencyCard = {
      bloodType: blood || null,
      emergencyContacts: validContacts,
      savedAt: new Date().toISOString(),
    };

    const profileData = {
      wallet_address: cleanAddr,
      display_name: name.trim(),
      role,
      specialisation: role === 'doctor' ? specialisation.trim() : null,
      hospital: role === 'doctor' ? hospital.trim() : null,
      medical_registration: role === 'doctor' ? medReg.trim() : null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      blood_group: blood || null,
      avatar_seed: cleanAddr,
      emergency_contacts: validContacts,
      emergency_card: emergencyCard,
    };

    // 1. Save to localStorage
    const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
    local[cleanAddr] = profileData;
    localStorage.setItem('medvault_local_profiles', JSON.stringify(local));
    localStorage.setItem('medvault_username', name.trim());
    localStorage.setItem('medvault_role', role);
    localStorage.setItem('medvault_phone', phone.trim());
    localStorage.setItem('medvault_email', email.trim());
    window.dispatchEvent(new Event('medvault_profile_updated'));

    // 2. Save to Supabase
    if (supabase) {
      try {
        const { error } = await supabase.from('profiles').insert(profileData);
        if (error) console.error('[MedVault] Supabase insert failed:', error);
      } catch (err) {
        console.error('[MedVault] Supabase insert exception:', err);
      }
    }

    setSaving(false);
    setShow(false);
    router.replace('/dashboard');
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm font-medium";

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-lg bg-[#0e1216] border border-white/10 rounded-t-3xl md:rounded-3xl p-8 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar space-y-6"
          >
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">{step === 1 ? '🩺' : '📋'}</span>
              </div>
              <h2 className="font-syne text-2xl font-black text-white">
                {step === 1 ? 'Welcome to MedVault' : 'Contact Details'}
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 font-mono">
                {address?.slice(0, 10)}...{address?.slice(-4)}
              </p>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
                <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
              </div>
            </div>

            {/* Step 1 — Identity */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Your full name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass}
                />

                <div className="grid grid-cols-2 gap-3">
                  {(['patient', 'doctor'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        role === r
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {r === 'patient' ? '🏥 Patient' : '🩺 Provider'}
                    </button>
                  ))}
                </div>

                {role === 'doctor' && (
                  <div className="space-y-3">
                    <input
                      required
                      placeholder="Specialisation *"
                      value={specialisation}
                      onChange={e => setSpecialisation(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      required
                      placeholder="Hospital / Clinic *"
                      value={hospital}
                      onChange={e => setHospital(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      placeholder="Medical Registration No. (optional)"
                      value={medReg}
                      onChange={e => setMedReg(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!name.trim() || (role === 'doctor' && (!specialisation.trim() || !hospital.trim()))}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-sky-400 transition-all text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2 — Contact Details */}
            {step === 2 && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <select
                  value={blood}
                  onChange={e => setBlood(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-primary/50 text-sm"
                >
                  <option value="" className="bg-[#0f172a] text-slate-500">Blood group (optional)</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                    <option key={g} value={g} className="bg-[#0e1216] text-white">{g}</option>
                  ))}
                </select>

                {/* Emergency Contacts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Emergency Contacts</label>
                    <button
                      type="button"
                      onClick={addEmergencyContact}
                      className="flex items-center gap-1 text-xs text-primary hover:text-sky-300 transition-colors font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Contact
                    </button>
                  </div>

                  {emergencyContacts.map((contact, index) => (
                    <div key={contact.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Contact {index + 1}
                        </span>
                        {emergencyContacts.length > 1 && (
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
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/25 focus:outline-none focus:border-primary/40 text-xs"
                        />
                        <input
                          placeholder="+91 XXXXX XXXXX"
                          value={contact.phone}
                          onChange={e => updateContact(contact.id, 'phone', e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/25 focus:outline-none focus:border-primary/40 text-xs"
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
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-sky-400 transition-all text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <span className="animate-pulse">Creating Profile...</span>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Save & Enter MedVault</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
