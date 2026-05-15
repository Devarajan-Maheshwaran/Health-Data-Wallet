'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Building2, Search, SendHorizonal } from 'lucide-react';

const TIERS = [
  { value: 'RECORD_READ', label: 'Record Read — view specific records' },
  { value: 'FULL_READ',   label: 'Full Read — all records + history' },
  { value: 'PROVIDER_WRITE', label: 'Provider Write — read + add notes' },
];

export function ProviderPage() {
  const { address } = useAccount();
  const [patientAddress, setPatientAddress] = useState('');
  const [tier, setTier] = useState('RECORD_READ');
  const [duration, setDuration] = useState('72');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendRequest = async () => {
    if (!address || !patientAddress) return;
    setSending(true);
    try {
      await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientAddress,
          requesterAddress: address,
          tier,
          durationSeconds: parseInt(duration) * 3600,
          reason,
        }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] px-4 pt-24 pb-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-7 w-7 text-sky-400" />
          <h1 className="text-2xl font-bold text-white">Provider Portal</h1>
        </div>
        <p className="mb-8 text-slate-400">Request access to a patient&apos;s records. The patient will be notified and must approve on-chain.</p>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Patient Wallet Address</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-mono text-white placeholder-slate-600 outline-none focus:border-sky-500"
                placeholder="0x..."
                value={patientAddress}
                onChange={e => setPatientAddress(e.target.value)}
              />
              <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Access Tier</label>
            <select
              className="w-full rounded-lg border border-white/10 bg-[#0A0F1E] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500"
              value={tier}
              onChange={e => setTier(e.target.value)}
            >
              {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Duration (hours)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              min="1"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Reason for request</label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500"
              rows={3}
              placeholder="Pre-operative assessment, cardiac consultation…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {sent ? (
            <div className="rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-400">
              ✓ Request sent — patient will be notified
            </div>
          ) : (
            <button
              onClick={sendRequest}
              disabled={sending || !patientAddress}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
              {sending ? 'Sending…' : 'Send Access Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
