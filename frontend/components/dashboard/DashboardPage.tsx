'use client';
import { useAccount, useReadContract } from 'wagmi';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CONTRACT_ADDRESSES, HEALTH_RECORD_STORE_ABI, DOC_TYPES } from '@/lib/contracts';
import { useRouter } from 'next/navigation';
import { FlaskConical, FileText, ImageIcon, Pill, Shield, Upload } from 'lucide-react';

const docTypeIcons = [FlaskConical, Pill, ImageIcon, FileText, Shield, Shield, FileText, FileText, FileText, FileText, FileText, FileText];

export function DashboardPage() {
  const { address } = useAccount();
  const router = useRouter();

  const { data: recordCount } = useReadContract({
    address: CONTRACT_ADDRESSES.HealthRecordStore,
    abi: HEALTH_RECORD_STORE_ABI,
    functionName: 'getRecordCount',
    args: [address!],
    query: { enabled: !!address },
  });

  // Use BigInt() constructor instead of literal 0n for broader TS target compatibility
  const count = Number(recordCount ?? BigInt(0));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </p>
          </div>
          <Button onClick={() => router.push('/vault')}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Record
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: count, color: 'text-primary' },
            { label: 'Access Grants', value: '—', color: 'text-success' },
            { label: 'Pending Requests', value: '—', color: 'text-warning' },
            { label: 'AI Queries', value: '—', color: 'text-white/70' },
          ].map((s) => (
            <Card key={s.label} className="text-center">
              <div className={`text-4xl font-black mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-white/50 text-xs">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Upload Record',   href: '/vault',     color: 'border-primary/30 text-primary' },
                { label: 'Emergency QR',    href: '/emergency', color: 'border-warning/30 text-warning' },
                { label: 'Drug Checker',    href: '/ai',        color: 'border-success/30 text-success' },
                { label: 'Manage Access',   href: '/access',    color: 'border-white/20 text-white/70' },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.href)}
                  className={`glass rounded-xl p-4 text-sm font-medium border ${a.color} hover:bg-white/5 transition-all`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder activity feed */}
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {count === 0 ? (
              <div className="text-center py-8 text-white/30">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No records yet. Upload your first document to get started.</p>
              </div>
            ) : (
              <p className="text-white/50">Activity feed loads from on-chain events — connect contract to see logs.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
