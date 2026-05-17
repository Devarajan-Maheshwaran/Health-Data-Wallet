'use client';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useReadContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES, ACCESS_CONTROLLER_ABI } from '@/lib/contracts';
import { Stethoscope } from 'lucide-react';

export function ProviderPortalPage() {
  const { address } = useAccount();
  const [patientAddr, setPatientAddr] = useState('');
  const [checkedAddr, setCheckedAddr] = useState('');

  const { data: accessData } = useReadContract({
    address: CONTRACT_ADDRESSES.AccessController,
    abi: ACCESS_CONTROLLER_ABI,
    functionName: 'hasAccess',
    args: [checkedAddr as `0x${string}`, address!, 0],
    query: { enabled: !!checkedAddr && !!address },
  });

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 mt-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <Stethoscope className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Provider Portal</h1>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans max-w-2xl bg-white/5 border border-white/10 rounded-xl p-3">
              <strong>How to Use:</strong> Used exclusively by registered clinical medical providers. Enter a patient's self-sovereign wallet address to verify if you currently possess active decryption keys under the opBNB on-chain ledger. You can submit an access request to petition the patient for new time-bound decryption permissions.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Check Patient Access</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Patient wallet address (0x...)"
                value={patientAddr}
                onChange={(e) => setPatientAddr(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
              />
              <Button onClick={() => setCheckedAddr(patientAddr)}>Check Access</Button>
            </div>
            {accessData !== undefined && (
              <div className="mt-4 glass rounded-xl p-4">
                <p className="text-sm">
                  Access:{' '}
                  <span className={accessData ? 'text-success' : 'text-danger'}>
                    {accessData ? '\u2705 Allowed' : '\u274c Denied'}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Request Patient Access</CardTitle></CardHeader>
          <CardContent>
            <p className="text-white/50 text-sm">Submit an access request — the patient will receive a notification and approve/reject on-chain.</p>
            <Button variant="ghost" className="mt-4">Submit Access Request</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
