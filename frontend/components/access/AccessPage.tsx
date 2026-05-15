'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck, ShieldX, Clock, Eye, PenLine, AlertCircle } from 'lucide-react';
import { ACCESS_CONTROLLER_ABI, ACCESS_CONTROLLER_ADDRESS } from '@/lib/contracts';

const TIER_LABELS = ['Emergency Read', 'Record Read', 'Full Read', 'Provider Write'];
const TIER_COLORS = ['text-yellow-400', 'text-sky-400', 'text-green-400', 'text-purple-400'];
const TIER_ICONS = [AlertCircle, Eye, Eye, PenLine];

type AccessRequest = {
  id: string;
  requester_address: string;
  tier: string;
  reason: string;
  duration_seconds: number | null;
  record_ids: number[];
  requested_at: string;
  status: string;
};

export function AccessPage() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/access-requests?address=${address}&role=patient`)
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  const approve = async (req: AccessRequest) => {
    const tierIndex = ['EMERGENCY_READ', 'RECORD_READ', 'FULL_READ', 'PROVIDER_WRITE'].indexOf(req.tier.toUpperCase());
    await writeContractAsync({
      address: ACCESS_CONTROLLER_ADDRESS,
      abi: ACCESS_CONTROLLER_ABI,
      functionName: 'grantAccess',
      args: [
        req.requester_address as `0x${string}`,
        tierIndex,
        BigInt(req.duration_seconds ?? 0),
        req.record_ids.map(BigInt),
      ],
    });
    await fetch(`/api/access-requests/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
  };

  const reject = async (req: AccessRequest) => {
    await fetch(`/api/access-requests/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-[#0A0F1E] px-4 pt-24 pb-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-white">Access Manager</h1>
        <p className="mb-8 text-slate-400">Review who has access to your records and approve or reject requests.</p>

        {/* Pending requests */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Pending Requests</h2>
          {loading ? (
            <div className="text-slate-500">Loading...</div>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
              No pending access requests
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(req => {
                const tierIdx = ['EMERGENCY_READ','RECORD_READ','FULL_READ','PROVIDER_WRITE'].indexOf(req.tier.toUpperCase());
                const TierIcon = TIER_ICONS[tierIdx] ?? Eye;
                return (
                  <div key={req.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-mono text-sm text-white">{req.requester_address}</p>
                      <div className="flex items-center gap-2">
                        <TierIcon className={`h-3.5 w-3.5 ${TIER_COLORS[tierIdx]}`} />
                        <span className={`text-xs ${TIER_COLORS[tierIdx]}`}>{TIER_LABELS[tierIdx]}</span>
                        {req.duration_seconds && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {Math.round(req.duration_seconds / 3600)}h
                          </span>
                        )}
                      </div>
                      {req.reason && <p className="text-xs text-slate-400">&ldquo;{req.reason}&rdquo;</p>}
                      <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(req.requested_at))} ago</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(req)}
                        className="flex items-center gap-1.5 rounded-lg bg-green-500/20 px-3 py-1.5 text-sm text-green-400 hover:bg-green-500/30"
                      >
                        <ShieldCheck className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => reject(req)}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/30"
                      >
                        <ShieldX className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Resolved */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Request History</h2>
          <div className="space-y-2">
            {resolved.map(req => (
              <div key={req.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/3 px-4 py-2 text-sm">
                <span className="font-mono text-slate-400 text-xs">{req.requester_address.slice(0,10)}…</span>
                <span className={`rounded px-2 py-0.5 text-xs ${
                  req.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>{req.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
