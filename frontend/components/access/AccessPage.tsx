'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ShieldCheck, ShieldX, Clock, Eye, AlertCircle, UserPlus, ShieldBan, Info } from 'lucide-react';
import { ACCESS_CONTROLLER_ABI, ACCESS_CONTROLLER_ADDRESS, ACCESS_TIERS } from '@/lib/contracts';
import { motion } from 'framer-motion';
import BorderGlow from '@/components/ui/BorderGlow';

export function AccessPage() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [grantee, setGrantee] = useState('');
  const [tier, setTier] = useState(1);
  const [duration, setDuration] = useState(86400); // 24h default
  const [isGranting, setIsGranting] = useState(false);

  const [revokeAddress, setRevokeAddress] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantee) return;
    setIsGranting(true);
    try {
      await writeContractAsync({
        address: ACCESS_CONTROLLER_ADDRESS,
        abi: ACCESS_CONTROLLER_ABI,
        functionName: 'grantAccess',
        args: [grantee as `0x${string}`, tier, BigInt(duration), []], // Empty array for all records for now
      });
      alert('Access granted successfully!');
      setGrantee('');
    } catch (err) {
      console.error(err);
      alert('Failed to grant access');
    }
    setIsGranting(false);
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeAddress) return;
    setIsRevoking(true);
    try {
      await writeContractAsync({
        address: ACCESS_CONTROLLER_ADDRESS,
        abi: ACCESS_CONTROLLER_ABI,
        functionName: 'revokeAccess',
        args: [revokeAddress as `0x${string}`],
      });
      alert('Access revoked successfully!');
      setRevokeAddress('');
    } catch (err) {
      console.error(err);
      alert('Failed to revoke access');
    }
    setIsRevoking(false);
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        
        <div className="mb-12">
          <h1 className="font-syne text-3xl font-black text-white mb-2">Access Manager</h1>
          <p className="text-slate-400">Cryptographically control who can read or write to your health records.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Grant Access Form */}
          <BorderGlow glowColor="200 80 60" colors={['#38bdf8', '#0284c7', '#0c4a6e']} className="w-full">
            <div className="bg-[#111518] rounded-[inherit] p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="font-syne text-xl font-bold text-white">Grant Access</h2>
              </div>
              <form onSubmit={handleGrant} className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Grantee Address (0x...)</label>
                  <input
                    type="text"
                    required
                    placeholder="0x1234..."
                    value={grantee}
                    onChange={(e) => setGrantee(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Access Tier</label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      {ACCESS_TIERS.map(t => (
                        <option key={t.value} value={t.value} className="bg-[#111518]">{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value={86400} className="bg-[#111518]">24 Hours</option>
                      <option value={604800} className="bg-[#111518]">7 Days</option>
                      <option value={2592000} className="bg-[#111518]">30 Days</option>
                      <option value={31536000} className="bg-[#111518]">1 Year</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isGranting || !grantee}
                  className="w-full mt-4 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  {isGranting ? 'Granting...' : 'Grant Access'}
                </button>
              </form>
            </div>
          </BorderGlow>

          {/* Revoke Access Form */}
          <BorderGlow glowColor="0 80 60" colors={['#f43f5e', '#be123c', '#4c0519']} className="w-full">
            <div className="bg-[#111518] rounded-[inherit] p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400">
                  <ShieldBan className="w-5 h-5" />
                </div>
                <h2 className="font-syne text-xl font-bold text-white">Revoke Access</h2>
              </div>
              <form onSubmit={handleRevoke} className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Revoke From Address (0x...)</label>
                  <input
                    type="text"
                    required
                    placeholder="0x1234..."
                    value={revokeAddress}
                    onChange={(e) => setRevokeAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Revoking access will immediately update the smart contract state. The grantee will no longer be able to decrypt your files or read your metadata.
                </p>
                <button
                  type="submit"
                  disabled={isRevoking || !revokeAddress}
                  className="w-full mt-auto bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold py-3 rounded-xl hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  <ShieldX className="w-5 h-5" />
                  {isRevoking ? 'Revoking...' : 'Revoke Access Immediately'}
                </button>
              </form>
            </div>
          </BorderGlow>

        </div>

        {/* Explainer Panel */}
        <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 flex gap-4 items-start">
          <Info className="w-6 h-6 text-sky-400 flex-shrink-0" />
          <div>
            <h3 className="font-syne text-white font-bold mb-2">How Access Control Works</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When you grant access, a transaction is sent to the <code>AccessController</code> smart contract on BNB Greenfield. 
              This contract maintains a cryptographically secure, time-bound mapping of permissions. If a doctor tries to read your data, 
              the protocol checks this contract. Once the duration expires, the permission automatically invalidates — no manual revocation required.
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
