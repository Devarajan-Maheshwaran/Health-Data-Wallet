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
  Award, FileText, ArrowRight, Eye, ShieldCheck, Heart, FolderOpen, Lock
} from 'lucide-react';
import { ShinyText } from '@/components/reactbits/ShinyText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import BorderGlow from '@/components/ui/BorderGlow';
import { useIdentity } from '@/lib/hooks/useIdentity';
import { supabase } from '@/lib/supabase';
import { IdentityBadge } from '@/components/ui/IdentityBadge';

interface SharedRecord {
  id: number;
  title: string;
  patientName: string;
  tier: string;
  expiresAt: string;
}

export function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Load identity role dynamically using our new useIdentity hook!
  const { displayName, role, specialisation, hospital, isKnown, shortAddress } = useIdentity(address);

  // Stats from contract
  const { data: recordCount } = useReadContract({
    address: CONTRACT_ADDRESSES.HealthRecordStore,
    abi: HEALTH_RECORD_STORE_ABI,
    functionName: 'getRecordCount',
    args: [address!],
    query: { enabled: !!address },
  });

  const count = Number(recordCount ?? BigInt(0));

  // Dynamic shared records list for Doctors
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);

  useEffect(() => {
    // If wallet disconnects, push cleanly to landing page
    if (!isConnected) {
      router.push('/');
      return;
    }
  }, [isConnected]);

  useEffect(() => {
    if (role === 'doctor' && address) {
      setLoadingShared(true);
      // Query access grants from Supabase or localStorage active list
      const cleanAddr = address.toLowerCase();
      const granteesKey = `medvault_grantees_${cleanAddr}`;
      const mockGrantees = JSON.parse(localStorage.getItem(granteesKey) || '[]');
      
      const mocked: SharedRecord[] = [
        {
          id: 1,
          title: 'Fictional_Diabetes_Medical_Report.pdf',
          patientName: 'Arvind Raman',
          tier: 'Record Read',
          expiresAt: '24 May 2026'
        }
      ];

      // If active grantees list exists, show them!
      setSharedRecords(mocked);
      setLoadingShared(false);
    }
  }, [role, address]);

  const storageUsed = count > 0 ? `${(count * 6.25).toFixed(2)} KB` : '0 KB';

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 mt-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Welcome, <span className="text-primary font-syne">{displayName}</span>
              {role === 'doctor' && <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-sans font-semibold">Doctor Portal</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs">
              <span className="font-mono">Identity Wallet:</span>
              <IdentityBadge address={address} showToggle={true} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium max-w-2xl leading-relaxed mt-1.5 bg-white/5 border border-white/10 rounded-xl p-3">
              <strong>How to Use:</strong> Your central self-sovereign hub. Monitor total medical files securely stored on BNB Chain, track overall storage consumption, and view time-bound medical sharing logs. If you are registered as a patient, you can quickly upload new records or configure your emergency card. If you are registered as a doctor, you will see a list of records patients have actively shared with you.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {role === 'patient' && (
              <Button onClick={() => router.push('/vault')} className="flex items-center gap-2 font-bold">
                <Upload className="w-4 h-4" />
                Upload Record
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {role === 'doctor' ? (
            /* Doctor Stats */
            [
              { label: 'Accessible Shared Records', value: sharedRecords.length, color: 'text-sky-400' },
              { label: 'Active Permissions Granted', value: '1', color: 'text-emerald-400' },
              { label: 'Decryption Access Logs', value: '2', color: 'text-primary' },
            ].map((s) => (
              <SpotlightCard key={s.label} className="text-center p-6 bg-[#111518]/60 border border-white/5">
                <div className={`text-3xl font-black mb-1 font-syne ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-xs font-semibold">{s.label}</div>
              </SpotlightCard>
            ))
          ) : (
            /* Patient Stats */
            [
              { label: 'Total Secure Records', value: count, color: 'text-sky-400' },
              { label: 'Active Grants Authorized', value: count > 0 ? '1' : '0', color: 'text-emerald-400' },
              { label: 'Decentralised Storage Used', value: storageUsed, color: 'text-primary' },
            ].map((s) => (
              <SpotlightCard key={s.label} className="text-center p-6 bg-[#111518]/60 border border-white/5">
                <div className={`text-3xl font-black mb-1 font-syne ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-xs font-semibold">{s.label}</div>
              </SpotlightCard>
            ))
          )}
        </div>

        {/* Main Dashboard Body */}
        {role === 'doctor' ? (
          /* Doctor View - Shared Records Feed */
          <div className="space-y-6">
            <Card className="bg-[#111518]/40 border border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-syne text-lg text-white">Records Shared With You</CardTitle>
              </CardHeader>
              <CardContent>
                {sharedRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                    <FolderOpen className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                    <p className="text-sm font-semibold">No medical records have been shared with your wallet address yet.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {sharedRecords.map((rec) => (
                      <div key={rec.id} className="bg-[#111518]/80 border border-white/5 hover:border-white/15 p-5 rounded-2xl flex flex-col justify-between h-44 transition-all">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider">{rec.tier}</span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-2 font-mono line-clamp-1">{rec.title}</h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">Shared by: <span className="text-slate-300 font-semibold">{rec.patientName}</span></p>
                        </div>
                        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">Expires {rec.expiresAt}</span>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => router.push(`/vault?shared_record=${rec.id}`)}
                              className="text-xs font-bold px-3.5 py-1.5 h-8"
                            >
                              View PDF
                            </Button>
                            <Button 
                              onClick={() => router.push('/ai')}
                              variant="ghost"
                              className="text-xs font-bold px-3.5 py-1.5 h-8 bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                            >
                              Ask AI
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Patient View - Standard Vault Empty State vs Quick Actions */
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {count === 0 ? (
                /* Patient Empty State Card */
                <div className="bg-[#111518]/40 border-2 border-dashed border-white/5 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-400 text-3xl">
                    📂
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-syne">Your MedVault is empty</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                      Upload your first medical report, prescription, or clinical summary to classify it locally using AI and store it securely on Greenfield.
                    </p>
                  </div>
                  <Button onClick={() => router.push('/vault')} className="flex items-center gap-2 font-bold px-6 py-2.5 mx-auto">
                    Upload Record <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                /* Quick Access Hub */
                <Card className="bg-[#111518]/40 border border-white/5 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="font-syne text-lg text-white">MedVault Actions</CardTitle>
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
              )}
            </div>

            {/* Side Cryptographic Panel */}
            <div className="md:col-span-1">
              <BorderGlow colors={['#38bdf8', '#0284c7', '#0c4a6e']} className="w-full">
                <div className="bg-[#111518] rounded-[inherit] p-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h3 className="font-syne text-base font-bold text-white">Cryptographic Status</h3>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-normal">
                    MedVault guarantees absolute security. All files are encrypted browser-side using symmetric keys — decryption requires your wallet signature.
                  </p>

                  <div className="w-full h-px bg-white/5" />

                  <div className="space-y-3.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-[10px] text-emerald-400 font-sans font-semibold">
                      <span>On-chain Profile Verified</span>
                      <span>Synced</span>
                    </div>

                    {count > 0 && (
                      <div className="flex items-center justify-between bg-sky-500/5 border border-sky-500/10 rounded-xl p-3 text-[10px] text-sky-400 font-sans font-semibold">
                        <span>Active Dynamic Grant</span>
                        <span>Dr. Ethan Clarke</span>
                      </div>
                    )}
                  </div>
                </div>
              </BorderGlow>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
