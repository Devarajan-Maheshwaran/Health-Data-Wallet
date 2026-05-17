'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Briefcase, Plus, Heart } from 'lucide-react';

export function OnboardingSheet() {
  const { isConnected, address } = useAccount();
  const [show, setShow] = useState(false);
  
  const [name, setName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | 'family'>('patient');
  
  // Doctor details
  const [specialisation, setSpecialisation] = useState('');
  const [hospital, setHospital] = useState('');
  const [medReg, setMedReg] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      const username = localStorage.getItem('medvault_username');
      if (!username) {
        setShow(true);
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  }, [isConnected, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    const cleanAddr = address?.toLowerCase() || '';

    // Save profile metadata locally
    localStorage.setItem('medvault_username', name);
    localStorage.setItem('medvault_role', role);
    localStorage.setItem('medvault_specialisation', role === 'doctor' ? specialisation : '');
    localStorage.setItem('medvault_hospital', role === 'doctor' ? hospital : '');
    localStorage.setItem('medvault_medreg', role === 'doctor' ? medReg : '');

    // Update in local cache registry of profiles
    const localProfilesStr = localStorage.getItem('medvault_local_profiles') || '{}';
    const localProfiles = JSON.parse(localProfilesStr);
    localProfiles[cleanAddr] = {
      wallet_address: cleanAddr,
      display_name: name,
      role: role,
      specialisation: role === 'doctor' ? specialisation : undefined,
      hospital: role === 'doctor' ? hospital : undefined,
      medical_registration: role === 'doctor' ? medReg : undefined,
      avatar_seed: cleanAddr
    };
    localStorage.setItem('medvault_local_profiles', JSON.stringify(localProfiles));

    // Dispatch reload events across active pages
    window.dispatchEvent(new Event('medvault_profile_updated'));

    // Simulated short block confirmation latency
    setTimeout(() => {
      setIsSubmitting(false);
      setShow(false);
    }, 700);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full max-w-lg bg-[#0e1216] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {/* Onboarding Header */}
            <div className="text-center relative">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <Heart className="w-6 h-6 text-sky-400 animate-pulse" />
              </div>
              <h2 className="font-syne text-2xl font-black text-white leading-tight">Welcome to MedVault</h2>
              <p className="text-slate-400 text-xs mt-1.5 font-mono">
                Identity Profile for Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" /> Full Name / Display Identity
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arvind Raman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              {/* Role Select Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" /> Role Context
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: 'patient', label: 'Patient', desc: 'Secure my files' },
                    { key: 'doctor', label: 'Doctor', desc: 'Clinical access' },
                    { key: 'family', label: 'Family', desc: 'Manage access' }
                  ].map((r) => {
                    const isSelected = role === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key as any)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all ${
                          isSelected ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        <span className="font-bold text-xs leading-none">{r.label}</span>
                        <span className="text-[10px] text-slate-400 leading-snug">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doctor Details */}
              <AnimatePresence>
                {role === 'doctor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 border-t border-white/5 pt-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-primary" /> Specialisation
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Diabetologist, Cardiologist"
                        value={specialisation}
                        onChange={(e) => setSpecialisation(e.target.value)}
                        className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hospital / Affiliation</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apollo Hospital"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Medical Registration Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MCI-182749"
                        value={medReg}
                        onChange={(e) => setMedReg(e.target.value)}
                        className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl hover:bg-sky-400 transition-all text-sm disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-sky-950/20"
              >
                {isSubmitting ? 'Securing Identity...' : 'Save & Continue →'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
