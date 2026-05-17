'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase, setSupabaseWallet } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export function OnboardingSheet() {
  const { address, isConnected } = useAccount();
  const [show, setShow] = useState(false);
  
  // Onboarding Form States
  const [name, setName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialisation, setSpecialisation] = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone] = useState('');
  const [blood, setBlood] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !supabase) return;

    // Set RPC context for RLS policies
    setSupabaseWallet(address).then(() => {
      // Check if profile exists in Supabase
      supabase
        .from('profiles')
        .select('wallet_address')
        .eq('wallet_address', address.toLowerCase())
        .maybeSingle()
        .then(({ data, error }: any) => {
          if (!data || error) {
            // Check local storage fallback to avoid infinite loops if supabase fails/offline
            const localProfilesStr = localStorage.getItem('medvault_local_profiles') || '{}';
            const localProfiles = JSON.parse(localProfilesStr);
            if (!localProfiles[address.toLowerCase()]) {
              setShow(true);
            }
          }
        });
    });
  }, [isConnected, address]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address) return;
    setSaving(true);

    const cleanAddr = address.toLowerCase();

    // 1. Write profile to local storage as robust fallback
    const localProfilesStr = localStorage.getItem('medvault_local_profiles') || '{}';
    const localProfiles = JSON.parse(localProfilesStr);
    localProfiles[cleanAddr] = {
      wallet_address: cleanAddr,
      display_name: name.trim(),
      role,
      specialisation: role === 'doctor' ? specialisation : undefined,
      hospital: role === 'doctor' ? hospital : undefined,
      phone: phone || undefined,
      blood_group: blood || undefined,
      avatar_seed: cleanAddr
    };
    localStorage.setItem('medvault_local_profiles', JSON.stringify(localProfiles));
    
    // Set demographic inputs in standard keys
    localStorage.setItem('medvault_username', name.trim());
    localStorage.setItem('medvault_role', role);
    localStorage.setItem('medvault_phone', phone || '');
    localStorage.setItem('medvault_email', '');

    // Dispatch custom event to notify all active pages to update
    window.dispatchEvent(new Event('medvault_profile_updated'));

    // 2. Attempt to write profile row to Supabase
    if (supabase) {
      try {
        await supabase.from('profiles').insert({
          wallet_address: cleanAddr,
          display_name: name.trim(),
          role,
          specialisation: role === 'doctor' ? specialisation : null,
          hospital: role === 'doctor' ? hospital : null,
          phone: phone || null,
          blood_group: blood || null,
        });
      } catch (err) {
        console.error('[MedVault] Supabase profiles insert failed:', err);
      }
    }

    setSaving(false);
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-lg bg-[#0e1216] border border-white/10 rounded-t-3xl md:rounded-3xl p-8 shadow-2xl space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <span className="text-2xl">🩺</span>
              </div>
              <h2 className="font-syne text-2xl font-black text-white leading-tight">Welcome to MedVault</h2>
              <p className="text-slate-400 text-xs mt-1.5 font-mono">
                Identity Profile for Address: <span className="text-sky-400">{address?.slice(0, 10)}...{address?.slice(-4)}</span>
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                required
                type="text"
                placeholder="Your full name *"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm font-medium"
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm font-medium" 
                  />
                  <input 
                    required
                    placeholder="Hospital / Clinic *" 
                    value={hospital}
                    onChange={e => setHospital(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm font-medium" 
                  />
                </div>
              )}

              <details className="group">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 transition-colors py-1 select-none font-semibold">
                  + Add Optional details (phone, blood group)
                </summary>
                <div className="mt-3 space-y-3">
                  <input 
                    placeholder="Phone Number (e.g. +91 98765 43210)"
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 text-sm" 
                  />
                  
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
                </div>
              </details>

              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-sky-400 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-sky-950/20"
              >
                {saving ? 'Creating Profile...' : 'Save & Enter MedVault →'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
