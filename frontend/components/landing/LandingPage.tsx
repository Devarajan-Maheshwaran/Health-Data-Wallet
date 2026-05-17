'use client';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Shield, Lock, Zap, QrCode, Brain, Clock,
  History, ArrowRight, AlertTriangle, ServerCrash,
  Ambulance, Database, Key, FileCheck, Users, Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

const painPoints = [
  {
    icon: Database,
    title: 'Your Records Are Locked Away',
    desc: 'Hospitals and clinics store your medical history in proprietary systems you have no direct access to. Getting a copy requires formal requests, fees, and weeks of waiting.',
  },
  {
    icon: ServerCrash,
    title: 'Data Silos Break Care Continuity',
    desc: 'Every time you see a new specialist, they start from scratch. Lab results, imaging, and prescription history never follow you automatically from one provider to the next.',
  },
  {
    icon: Ambulance,
    title: 'Emergencies Expose the Gap',
    desc: 'In a critical situation, first responders cannot access your blood type, allergies, or active medications. This information gap costs lives every year.',
  },
];

const features = [
  {
    icon: Brain,
    title: 'AI Analysis Runs Entirely In Your Browser',
    desc: 'Named Entity Recognition (NER), medical Q&A, and drug interaction checks all execute locally on your device using WebAssembly. No text from your records is ever sent to any external server or API.',
  },
  {
    icon: QrCode,
    title: 'Emergency QR Code — Instant Critical Data',
    desc: 'Generate a scannable QR code that encodes your blood type, active allergies, and current medications. First responders can access this in seconds, even without a smartphone connection to your wallet.',
  },
  {
    icon: Clock,
    title: 'Time-Limited, Revocable Access Grants',
    desc: 'Share your records with a cardiologist for exactly 72 hours. A smart contract enforces the expiry automatically — no manual revocation required. You can also revoke access immediately at any time.',
  },
  {
    icon: History,
    title: 'Immutable Version History On-Chain',
    desc: 'Every upload and update is recorded on the BNB Greenfield blockchain with a timestamp and content hash. Nothing is silently overwritten. You have a full audit trail of every change to your health records.',
  },
];

const steps = [
  {
    n: '01',
    label: 'Connect Your Wallet',
    desc: 'Use MetaMask or any WalletConnect-compatible wallet. Your wallet address becomes your identity — no email or password needed.',
  },
  {
    n: '02',
    label: 'Upload a Medical Document',
    desc: 'Drop a PDF or image (lab report, prescription, discharge summary). The AI pipeline extracts and classifies its contents locally before upload.',
  },
  {
    n: '03',
    label: 'Review AI Extraction',
    desc: 'Inspect the detected document type and extracted entities (diagnoses, medications, dates). Override anything the AI got wrong.',
  },
  {
    n: '04',
    label: 'Encrypt and Store',
    desc: 'Your file is encrypted with AES-256-GCM in-browser using a key derived from your wallet signature. The encrypted blob is stored on BNB Greenfield decentralised storage.',
  },
  {
    n: '05',
    label: 'Grant Access As Needed',
    desc: 'Share records with any Ethereum address for a defined period. The HealthRecordStore smart contract manages permissions on-chain.',
  },
];

const techStack = [
  { label: 'BNB Greenfield', detail: 'Decentralised object storage — your encrypted files live on-chain, not on any company server.' },
  { label: 'Solidity Smart Contract', detail: 'HealthRecordStore contract handles ownership, access control, and version history.' },
  { label: 'Transformers.js (WASM)', detail: 'In-browser AI models via WebAssembly — MiniLM for embeddings, BERT-NER for entities, Flan-T5 for Q&A.' },
  { label: 'RainbowKit + wagmi', detail: 'Wallet connection and on-chain reads/writes through a clean, typed React interface.' },
  { label: 'AES-256-GCM Encryption', detail: 'Client-side encryption before any data leaves your browser. Decryption requires your wallet signature.' },
];

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface bg-grid-pattern">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold text-primary">
          <Shield className="w-6 h-6" />
          MedVault
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-xs text-slate-400 border border-white/10 rounded-full px-3 py-1">
            BNB Greenfield Testnet
          </span>
          <ConnectButton showBalance={false} />
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-primary mb-8 border border-primary/20">
            <Lock className="w-3 h-3" />
            Zero external APIs. All AI runs locally. Fully open source.
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-textPrimary leading-tight mb-6">
            Your health records,<br />
            <span className="text-primary">under your control.</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-4">
            MedVault is a decentralised health data wallet. Upload medical documents, have AI extract and classify them in your browser, then store the encrypted files on the blockchain. Share access with doctors using time-limited smart contract permissions.
          </p>
          <p className="text-sm text-white/35 max-w-2xl mx-auto mb-10">
            Running on BNB Greenfield Testnet. Connect a wallet with testnet BNB to get started. No real funds or real medical data required for testing.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal, account, mounted }) => {
              const isConnected = mounted && !!account;
              return (
                <button
                  onClick={isConnected ? () => router.push('/dashboard') : openConnectModal}
                  className="inline-flex items-center gap-2 bg-primary text-surface font-bold px-8 py-4 rounded-xl text-lg glow-primary hover:bg-sky-400 transition-all"
                >
                  {isConnected ? 'Open Dashboard' : 'Connect Wallet to Get Started'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              );
            }}
          </ConnectButton.Custom>
          <p className="mt-4 text-xs text-white/30">
            Requires MetaMask or any WalletConnect wallet. Free to use on testnet.
          </p>
        </motion.div>
      </section>

      {/* How to use — step by step */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">How to use MedVault</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Follow these steps to upload, secure, and share your medical records. The entire process takes under 5 minutes for a first-time user.
          </p>
        </div>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-5 items-start rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex-shrink-0 text-3xl font-black text-primary/30 w-10 text-right leading-none pt-1">{s.n}</div>
              <div>
                <p className="text-white font-semibold text-base mb-1">{s.label}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pain points */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">The problem with healthcare data today</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Healthcare systems were not designed with patient data portability in mind. MedVault is built to change that.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {painPoints.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full">
                <div className="mb-4 p-2.5 rounded-xl bg-sky-500/10 w-fit">
                  <p.icon className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Feature highlights</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Every core feature is designed to keep your data private, portable, and exclusively under your control.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="flex items-start gap-4 h-full">
                <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1.5">{f.title}</div>
                  <div className="text-white/50 text-sm leading-relaxed">{f.desc}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Built on open technology</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            No proprietary backends. Every component is auditable, self-hostable, and decentralised by design.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {techStack.map((t, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-sky-400 font-semibold text-sm mb-1">{t.label}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security note */}
      <section className="py-12 px-6 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-5 flex gap-4 items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold text-sm mb-1">Testnet — Do not upload real medical data</p>
            <p className="text-yellow-200/60 text-sm leading-relaxed">
              MedVault is currently running on BNB Greenfield Testnet for demonstration and development purposes.
              Do not upload actual personal health information. Testnet data may be reset at any time.
              The smart contract has not been audited for production use.
            </p>
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to take back your health data?</h2>
        <p className="text-white/40 mb-2 text-sm">No registration. No password. Your wallet is your account.</p>
        <p className="text-white/25 mb-8 text-xs">Requires a Web3 wallet with BNB Greenfield Testnet configured.</p>
        <ConnectButton />
      </section>
    </div>
  );
}
