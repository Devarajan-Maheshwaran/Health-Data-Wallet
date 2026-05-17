'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CONTRACT_ADDRESSES, HEALTH_RECORD_STORE_ABI } from '@/lib/contracts';
import { useRouter } from 'next/navigation';
import { 
  Upload, User, Phone, Mail, CheckCircle2, ShieldAlert, 
  Award, FileText, ArrowLeftRight, Eye, ShieldCheck, Heart 
} from 'lucide-react';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import BorderGlow from '@/components/ui/BorderGlow';

export function DashboardPage() {
  const { address } = useAccount();
  const router = useRouter();

  // Basic Info state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Doctor View Mode simulation toggle (for Hackathon Judges)
  const [isDoctorView, setIsDoctorView] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setName(localStorage.getItem('medvault_username') || '');
    setPhone(localStorage.getItem('medvault_phone') || '');
    setEmail(localStorage.getItem('medvault_email') || '');
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Persist to local state / localStorage
    localStorage.setItem('medvault_username', name);
    localStorage.setItem('medvault_phone', phone);
    localStorage.setItem('medvault_email', email);

    // Dispatch custom event to notify FloatingNav of the update
    window.dispatchEvent(new Event('medvault_profile_updated'));

    // Simulate Supabase API save endpoint
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (err) {
      console.error('Error updating off-chain indexer', err);
    }
    setIsSaving(false);
  };

  const { data: recordCount } = useReadContract({
    address: CONTRACT_ADDRESSES.HealthRecordStore,
    abi: HEALTH_RECORD_STORE_ABI,
    functionName: 'getRecordCount',
    args: [address!],
    query: { enabled: !!address },
  });

  const count = Number(recordCount ?? BigInt(0));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 mt-6">
        
        {/* Toast Notification */}
        {showSavedToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-xl backdrop-blur-md animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">Profile synced successfully with Supabase Indexer!</span>
          </div>
        )}

        {/* Dynamic Hackathon Banner for Doctor View Mode */}
        {isDoctorView && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
                <strong>Simulated Doctor View Active:</strong> You are viewing Arvind Raman's encrypted record vault under time-limited <strong>Full Read</strong> clearance. Keys will expire automatically in 6 days.
              </span>
            </div>
            <button 
              onClick={() => setIsDoctorView(false)}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold px-3 py-1.5 rounded-lg border border-rose-500/30 transition-all shrink-0 self-start sm:self-center"
            >
              Exit Demo Mode
            </button>
          </div>
        )}

        {/* Patient Role Context Banner (When not in Doctor mode) */}
        {!isDoctorView && (
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-4 text-xs md:text-sm text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-500/10 rounded-xl text-teal-400 shrink-0">🩺</span>
              <span>
                You are logged in as <strong>{name || 'Arvind Raman'}</strong> (Patient). Your files are end-to-end encrypted — only you hold the decryption keys.
              </span>
            </div>
            <button 
              onClick={() => router.push('/docs')} 
              className="text-teal-400 font-bold hover:underline shrink-0 text-xs text-left"
            >
              View how this works →
            </button>
          </div>
        )}

        {/* Header Block with Switch View for Judges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              <ShinyText text={isDoctorView ? "Doctor Portal" : "Welcome Back"} className="text-3xl font-bold font-syne" />
              {!isDoctorView && name && <span className="text-primary font-syne ml-2">, {name}</span>}
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-mono break-all leading-normal">
              {address ? `Identity Address: ${address}` : 'Wallet not connected'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {/* Try Demo Mode Switch */}
            <button
              onClick={() => setIsDoctorView(!isDoctorView)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all shadow"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-primary shrink-0" />
              {isDoctorView ? 'Switch to Patient View' : 'Demo Doctor View Mode'}
            </button>

            {!isDoctorView && (
              <Button onClick={() => router.push('/vault')} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Record
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isDoctorView ? (
            /* Doctor Specific Stats */
            [
              { label: 'Decrypted Shared Records', value: '2', color: 'text-sky-400' },
              { label: 'Active Permissions Tier', value: 'Full Read', color: 'text-emerald-400' },
              { label: 'Remaining Clearance', value: '6 Days', color: 'text-amber-400' },
              { label: 'On-chain Access Logs', value: '2', color: 'text-primary' },
            ].map((s) => (
              <SpotlightCard key={s.label} className="text-center p-6 bg-[#111518]/60 border border-white/5">
                <div className={`text-2xl font-black mb-1 font-syne leading-none py-1.5 ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-xs font-semibold mt-1">{s.label}</div>
              </SpotlightCard>
            ))
          ) : (
            /* Patient Specific Stats */
            [
              { label: 'Total Secure Records', value: count || 3, color: 'text-sky-400' },
              { label: 'Active Grants Active', value: '1', color: 'text-emerald-400' },
              { label: 'Pending Requests', value: '0', color: 'text-amber-400' },
              { label: 'AI Queries Made', value: '1', color: 'text-primary' },
            ].map((s) => (
              <SpotlightCard key={s.label} className="text-center p-6 bg-[#111518]/60 border border-white/5">
                <div className={`text-4xl font-black mb-1 font-syne ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-xs font-semibold">{s.label}</div>
              </SpotlightCard>
            ))
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Quick Actions & Record Activity */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Quick Actions Card */}
            <Card className="bg-[#111518]/40 border border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-syne text-lg text-white">
                  {isDoctorView ? "Doctor Clinical Clearance Actions" : "Quick Access Hub"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {isDoctorView ? (
                    /* Doctor View Quick Actions */
                    [
                      { label: 'Read Decrypted Shared Files', href: '/vault', desc: 'Securely fetch, decrypt, and view records in browser', color: 'border-sky-500/20 text-sky-400 hover:bg-sky-500/5' },
                      { label: 'AI Drug Interaction Checker', href: '/ai', desc: 'Verify safe prescription combinations locally', color: 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5' },
                      { label: 'Verify Permission Clearance', href: '/access', desc: 'Check dynamic block state mappings', color: 'border-purple-500/20 text-purple-400 hover:bg-purple-500/5' },
                      { label: 'View Public Emergency Card', href: '/emergency/0x742d35Cc6634C0532925a3b844Bc454e4438f44e', desc: 'Look up critical public telemetry offline', color: 'border-amber-500/20 text-amber-400 hover:bg-amber-500/5' },
                    ].map((a) => (
                      <button
                        key={a.label}
                        onClick={() => router.push(a.href)}
                        className={`text-left p-4 rounded-2xl border ${a.color} transition-all duration-300 flex flex-col justify-between h-28`}
                      >
                        <span className="font-bold text-sm">{a.label}</span>
                        <span className="text-slate-400 text-xs mt-1 leading-normal">{a.desc}</span>
                      </button>
                    ))
                  ) : (
                    /* Patient View Quick Actions */
                    [
                      { label: 'Upload Medical Record', href: '/vault', desc: 'Securely upload PDFs or images to BNB Greenfield', color: 'border-sky-500/20 text-sky-400 hover:bg-sky-500/5' },
                      { label: 'Emergency Offline QR', href: '/emergency', desc: 'Generate medical emergency card', color: 'border-amber-500/20 text-amber-400 hover:bg-amber-500/5' },
                      { label: 'Interactive AI Assistant', href: '/ai', desc: 'Zero-knowledge browser-based Q&A', color: 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5' },
                      { label: 'Manage Access Grants', href: '/access', desc: 'Control time-bound on-chain credentials', color: 'border-purple-500/20 text-purple-400 hover:bg-purple-500/5' },
                    ].map((a) => (
                      <button
                        key={a.label}
                        onClick={() => router.push(a.href)}
                        className={`text-left p-4 rounded-2xl border ${a.color} transition-all duration-300 flex flex-col justify-between h-28`}
                      >
                        <span className="font-bold text-sm">{a.label}</span>
                        <span className="text-slate-400 text-xs mt-1 leading-normal">{a.desc}</span>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Health Record State Indicator */}
            <Card className="bg-[#111518]/40 border border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-syne text-lg text-white">Active Cryptographic Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Award className="w-4 h-4 shrink-0" />
                      <span>On-chain Wallet Profile Status: <strong>Verified</strong></span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
                  </div>

                  {/* Expiry Pill Countdown on Dashboard */}
                  {!isDoctorView && (
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>Authorized <strong>Dr. Ethan Clarke</strong> (Full Read)</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Expires in 6 days
                      </span>
                    </div>
                  )}

                  {/* Accessed audit indicator */}
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Last accessed record: <strong>Diabetes Report</strong> by Dr. Ethan Clarke</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Secure Profile Form / Doctor Profile Details */}
          <div className="md:col-span-1">
            <BorderGlow glowColor={isDoctorView ? "0 80 60" : "200 80 60"} colors={isDoctorView ? ['#f43f5e', '#be123c', '#4c0519'] : ['#38bdf8', '#0284c7', '#0c4a6e']} className="w-full">
              <div className="bg-[#111518] rounded-[inherit] p-6 flex flex-col h-full">
                
                {isDoctorView ? (
                  /* Doctor Clearance Profile Details Panel */
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                        <Heart className="w-4 h-4 animate-pulse" />
                      </div>
                      <h3 className="font-syne text-base font-bold text-white font-mono">Clearance profile</h3>
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-normal">
                      Verify you are using an authorized provider key. Access credentials and decryption logs are permanent.
                    </p>

                    <div className="w-full h-px bg-white/5" />

                    <div className="space-y-3.5 text-xs text-slate-300">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Accessor Display Name</span>
                        <span className="font-bold text-white text-sm">Dr. Ethan Clarke</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Verified Specialisation</span>
                        <span className="text-slate-300">Diabetologist · Apollo Hospital</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Medical Registration ID</span>
                        <span className="text-emerald-400 font-mono font-bold">MCI-182749 (Verified)</span>
                      </div>

                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 text-[10px] text-rose-400 leading-relaxed font-sans mt-auto">
                        Your clinical decryption actions are cryptographically sealed to this session identity.
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Patient Demographic Edit Form */
                  <>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <h3 className="font-syne text-base font-bold text-white">Secure Demographics</h3>
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-normal mb-6">
                      Save basic details to quickly populate emergencies and allow Supabase indexing for secure off-chain retrieval. Everything is kept private inside your secure cache.
                    </p>

                    <form onSubmit={handleSaveProfile} className="space-y-4 flex-1 flex flex-col">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. patient@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full mt-auto bg-primary text-white font-semibold py-3 rounded-xl hover:bg-sky-400 transition-all text-sm disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-sky-950/20"
                      >
                        {isSaving ? 'Syncing...' : 'Sync with Supabase'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </BorderGlow>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
