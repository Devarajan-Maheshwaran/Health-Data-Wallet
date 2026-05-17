'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase, setSupabaseWallet } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Plus, Trash2 } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export function ProfileSheet({ open, onClose }: Props) {
  const { address } = useAccount();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialisation, setSpecialisation] = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [blood, setBlood] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' }
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current profile on open
  useEffect(() => {
    if (!open || !address) return;
    const cleanAddr = address.toLowerCase();

    // Try Supabase first
    if (supabase) {
      setSupabaseWallet(address).then(() => {
        supabase.from('profiles').select('*').eq('wallet_address', cleanAddr).maybeSingle()
          .then(({ data }: any) => {
            if (data) {
              setName(data.display_name || '');
              setRole(data.role === 'doctor' ? 'doctor' : 'patient');
              setSpecialisation(data.specialisation || '');
              setHospital(data.hospital || '');
              setPhone(data.phone || '');
              setEmail(data.email || '');
              setBlood(data.blood_group || '');
              
              if (data.emergency_contacts && data.emergency_contacts.length > 0) {
                setEmergencyContacts(
                  data.emergency_contacts.map((c: any) => ({
                    id: c.id || crypto.randomUUID(),
                    ...c
                  }))
                );
              } else {
                setEmergencyContacts([
                  { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' }
                ]);
              }
              return;
            }
            // Fallback: localStorage
            loadFromLocal(cleanAddr);
          })
          .catch(() => {
            loadFromLocal(cleanAddr);
          });
      }).catch(() => {
        loadFromLocal(cleanAddr);
      });
    } else {
      loadFromLocal(cleanAddr);
    }
  }, [open, address]);

  function loadFromLocal(cleanAddr: string) {
    const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
    const p = local[cleanAddr];
    if (p) {
      setName(p.display_name || '');
      setRole(p.role === 'doctor' ? 'doctor' : 'patient');
      setSpecialisation(p.specialisation || '');
      setHospital(p.hospital || '');
      setPhone(p.phone || '');
      setEmail(p.email || '');
      setBlood(p.blood_group || '');
      
      if (p.emergency_contacts && p.emergency_contacts.length > 0) {
        setEmergencyContacts(
          p.emergency_contacts.map((c: any) => ({
            id: c.id || crypto.randomUUID(),
            ...c
          }))
        );
      } else {
        setEmergencyContacts([
          { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' }
        ]);
      }
    } else {
      setName(localStorage.getItem('medvault_username') || '');
      setRole((localStorage.getItem('medvault_role') as any) || 'patient');
      setPhone(localStorage.getItem('medvault_phone') || '');
      setEmail(localStorage.getItem('medvault_email') || '');
      setEmergencyContacts([
        { id: crypto.randomUUID(), name: '', phone: '', relationship: 'family' }
      ]);
    }
  }

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address) return;
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
      specialisation: role === 'doctor' ? specialisation : null,
      hospital: role === 'doctor' ? hospital : null,
      phone: phone || null,
      email: email || null,
      blood_group: blood || null,
      emergency_contacts: validContacts,
      emergency_card: emergencyCard,
    };

    // Update localStorage
    const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
    local[cleanAddr] = profileData;
    localStorage.setItem('medvault_local_profiles', JSON.stringify(local));
    localStorage.setItem('medvault_username', name.trim());
    localStorage.setItem('medvault_role', role);
    localStorage.setItem('medvault_phone', phone);
    localStorage.setItem('medvault_email', email);
    window.dispatchEvent(new Event('medvault_profile_updated'));

    // Update Supabase
    if (supabase) {
      try {
        await setSupabaseWallet(address);
        await supabase.from('profiles').upsert(profileData);
      } catch (err) {
        console.error('[MedVault] Profile update failed:', err);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[100] w-full max-w-sm bg-[#0e1216] border-l border-white/10 shadow-2xl overflow-y-auto no-scrollbar"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-syne text-lg font-bold text-white">Your Profile</h2>
                    <p className="text-xs text-slate-500 font-mono">{address?.slice(0,10)}...{address?.slice(-4)}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full h-px bg-white/5" />

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm"
                    placeholder="Your full name" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['patient', 'doctor'] as const).map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all ${role === r ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5'}`}>
                        {r === 'patient' ? '🏥 Patient' : '🩺 Provider'}
                      </button>
                    ))}
                  </div>
                </div>

                {role === 'doctor' && (
                  <div className="space-y-3">
                    <input value={specialisation} onChange={e => setSpecialisation(e.target.value)}
                      placeholder="Specialisation"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm" />
                    <input value={hospital} onChange={e => setHospital(e.target.value)}
                      placeholder="Hospital / Clinic"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm" />
                  </div>
                )}

                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm" />

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm"
                />

                <select value={blood} onChange={e => setBlood(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-primary/50 text-sm">
                  <option value="" className="bg-[#0f172a] text-slate-500">Blood group (optional)</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                    <option key={g} value={g} className="bg-[#0e1216] text-white">{g}</option>
                  ))}
                </select>

                {/* Emergency Contacts */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">Emergency Contacts</label>
                    <button
                      type="button"
                      onClick={addEmergencyContact}
                      className="flex items-center gap-1 text-xs text-primary hover:text-sky-300 transition-colors font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Contact
                    </button>
                  </div>

                  {emergencyContacts.map((contact, index) => (
                    <div key={contact.id || index} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Contact {index + 1}
                        </span>
                        {emergencyContacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmergencyContact(contact.id!)}
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
                          onChange={e => updateContact(contact.id!, 'name', e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/25 focus:outline-none focus:border-primary/40 text-xs"
                        />
                        <input
                          placeholder="Phone number"
                          value={contact.phone}
                          onChange={e => updateContact(contact.id!, 'phone', e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/25 focus:outline-none focus:border-primary/40 text-xs"
                        />
                      </div>
                      <select
                        value={contact.relationship}
                        onChange={e => updateContact(contact.id!, 'relationship', e.target.value)}
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

                <button type="submit" disabled={!name.trim() || saving}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-sky-400 transition-all text-sm disabled:opacity-40 flex items-center justify-center gap-2 mt-4">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
