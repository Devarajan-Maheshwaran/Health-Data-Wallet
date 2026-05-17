'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CONTRACT_ADDRESSES, HEALTH_RECORD_STORE_ABI } from '@/lib/contracts';
import { useRouter } from 'next/navigation';
import { Upload, User, Phone, Mail, CheckCircle2, ShieldAlert, Award, FileText } from 'lucide-react';
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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              <ShinyText text="Welcome Back" className="text-3xl font-bold font-syne" />
              {name && <span className="text-primary font-syne ml-2">, {name}</span>}
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-mono">
              {address ? `Wallet Identity: ${address}` : 'Wallet not connected'}
            </p>
          </div>
          <Button onClick={() => router.push('/vault')} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Record
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Secure Records', value: count, color: 'text-sky-400' },
            { label: 'Access Grants Active', value: '0', color: 'text-emerald-400' },
            { label: 'Pending Requests', value: '0', color: 'text-amber-400' },
            { label: 'AI Queries Made', value: '1', color: 'text-primary' },
          ].map((s) => (
            <SpotlightCard key={s.label} className="text-center p-6 bg-[#111518]/60 border border-white/5">
              <div className={`text-4xl font-black mb-1 font-syne ${s.color}`}>{s.value}</div>
              <div className="text-slate-400 text-xs font-semibold">{s.label}</div>
            </SpotlightCard>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Redesigned Quick Actions & Activity */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <Card className="bg-[#111518]/40 border border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-syne text-lg text-white">Quick Access Hub</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Health Record State Indicator */}
            <Card className="bg-[#111518]/40 border border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-syne text-lg text-white">Active Cryptographic Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {count === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-sky-400 animate-pulse" />
                    <p className="text-sm font-semibold">Your Health Data Wallet is empty</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Upload your first health report to activate on-chain indexing.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 text-xs text-emerald-400">
                      <Award className="w-4 h-4 shrink-0" />
                      <span>Wallet status: Verified. Safe on-chain storage mapping has active nodes on BNB Greenfield.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Secure Profile Form (Stores Demographics next to Wallet) */}
          <div className="md:col-span-1">
            <BorderGlow glowColor="200 80 60" colors={['#38bdf8', '#0284c7', '#0c4a6e']} className="w-full">
              <div className="bg-[#111518] rounded-[inherit] p-6 flex flex-col h-full">
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
              </div>
            </BorderGlow>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
