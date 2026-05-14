'use client';
import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CONTRACT_ADDRESSES, ACCESS_CONTROLLER_ABI, ACCESS_TIERS } from '@/lib/contracts';
import { formatDuration } from '@/lib/utils';

export function AccessManagerPage() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [accessorAddr, setAccessorAddr] = useState('');
  const [tier, setTier] = useState(1);
  const [duration, setDuration] = useState(259200); // 72 hours

  function grantAccess() {
    if (!accessorAddr) return;
    writeContract({
      address: CONTRACT_ADDRESSES.AccessController,
      abi: ACCESS_CONTROLLER_ABI,
      functionName: 'grantAccess',
      args: [accessorAddr as `0x${string}`, tier, BigInt(duration), []],
    });
  }

  function revokeAccess(accessor: string) {
    writeContract({
      address: CONTRACT_ADDRESSES.AccessController,
      abi: ACCESS_CONTROLLER_ABI,
      functionName: 'revokeAccess',
      args: [accessor as `0x${string}`],
    });
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-textPrimary">Access Manager</h1>

        {/* Grant access form */}
        <Card>
          <CardHeader><CardTitle>Grant Access</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Accessor wallet address (0x...)"
                value={accessorAddr}
                onChange={(e) => setAccessorAddr(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
              />
              <select
                value={tier}
                onChange={(e) => setTier(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                {ACCESS_TIERS.map((t) => (
                  <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>
                ))}
              </select>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                <option value={3600}   className="bg-surface">1 Hour</option>
                <option value={86400}  className="bg-surface">24 Hours</option>
                <option value={259200} className="bg-surface">72 Hours</option>
                <option value={604800} className="bg-surface">7 Days</option>
                <option value={2592000}className="bg-surface">30 Days</option>
                <option value={0}      className="bg-surface">Permanent</option>
              </select>
              <Button onClick={grantAccess} disabled={!accessorAddr}>Grant Access</Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit log placeholder */}
        <Card>
          <CardHeader><CardTitle>Access Audit Log</CardTitle></CardHeader>
          <CardContent>
            <p className="text-white/40 text-sm">On-chain access events appear here after contract deployment and integration.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
