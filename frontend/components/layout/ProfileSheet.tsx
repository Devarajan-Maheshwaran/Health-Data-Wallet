'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase, setSupabaseWallet } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Stethoscope } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

export function ProfileSheet({ open, onClose }: Props) {
  const { address } = useAccount();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialisation, setSpecialisation] = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone] = useState('');
  const [blood, setBlood] = useState('');
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
              setBlood(data.blood_group || '');
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
      setBlood(p.blood_group || '');
    } else {
      setName(localStorage.getItem('medvault_username') || '');
      setRole((localStorage.getItem('medvault_role') as any) || 'patient');
      setPhone(localStorage.getItem('medvault_phone') || '');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address) return;
    setSaving(true);
    const cleanAddr = address.toLowerCase();

    // Update localStorage
    const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
    local[cleanAddr] = { wallet_address: cleanAddr, display_name: name.trim(), role, specialisation, hospital, phone, blood_group: blood };
    localStorage.setItem('medvault_local_profiles', JSON.stringify(local));
    localStorage.setItem('medvault_username', name.trim());
    localStorage.setItem('medvault_role', role);
    localStorage.setItem('medvault_phone', phone);
    window.dispatchEvent(new Event('medvault_profile_updated'));

    // Update Supabase
    if (supabase) {
      try {
        await setSupabaseWallet(address);
        await supabase.from('profiles').upsert({
          wallet_address: cleanAddr,
          display_name: name.trim(),
          role,
          specialisation: role === 'doctor' ? specialisation : null,
          hospital: role === 'doctor' ? hospital : null,
          phone: phone || null,
          blood_group: blood || null,
        });
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

                <select value={blood} onChange={e => setBlood(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-primary/50 text-sm">
                  <option value="" className="bg-[#0f172a] text-slate-500">Blood group (optional)</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                    <option key={g} value={g} className="bg-[#0e1216] text-white">{g}</option>
                  ))}
                </select>

                <button type="submit" disabled={!name.trim() || saving}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-sky-400 transition-all text-sm disabled:opacity-40 flex items-center justify-center gap-2">
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
