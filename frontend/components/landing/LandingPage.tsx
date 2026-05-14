'use client';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Lock, Zap, QrCode, Brain, Clock, History, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const painPoints = [
  { icon: '🏥', title: 'Hospitals Own Your Data', desc: 'Your records are locked in siloed hospital systems you cannot access or export.' },
  { icon: '🔗', title: 'No Interoperability', desc: 'Every new doctor starts from scratch. Your history never follows you.' },
  { icon: '🚑', title: 'Emergency Access Fails', desc: 'In an emergency, critical info like allergies or blood type is unreachable.' },
];

const features = [
  { icon: Brain,   title: 'In-Browser AI',       desc: 'NER, Q&A and drug interaction checks — all running locally in your browser. Zero data sent to any server.' },
  { icon: QrCode,  title: 'Emergency QR',        desc: 'One scannable QR gives first responders your blood type, allergies and current meds instantly.' },
  { icon: Clock,   title: 'Time-Limited Access', desc: 'Grant a cardiologist access for exactly 72 hours. Smart contract auto-expires it.' },
  { icon: History, title: 'Version History',      desc: 'Every record update is versioned on-chain. Nothing is ever lost or overwritten.' },
];

const steps = [
  { n: '01', label: 'Upload', desc: 'Drop your PDF or image' },
  { n: '02', label: 'Encrypt', desc: 'AES-256 in-browser before upload' },
  { n: '03', label: 'Store', desc: 'Encrypted blob on BNB Greenfield' },
  { n: '04', label: 'Share', desc: 'Grant access via smart contract' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface bg-grid-pattern">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold text-primary">
          <Shield className="w-6 h-6" />
          MedVault
        </div>
        <ConnectButton showBalance={false} />
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-primary mb-8 border border-primary/20">
            <Lock className="w-3 h-3" /> Zero API keys. Zero servers see your data. Open source.
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-textPrimary leading-tight mb-6">
            Your health data,<br />
            <span className="text-primary">your control.</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            MedVault encrypts your medical records in your browser, stores them on decentralised storage, and lets you grant or revoke access to any doctor — via your crypto wallet.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal, connected }) => (
              <button
                onClick={openConnectModal}
                className="inline-flex items-center gap-2 bg-primary text-surface font-bold px-8 py-4 rounded-xl text-lg glow-primary hover:bg-sky-400 transition-all"
              >
                {connected ? 'Go to Dashboard' : 'Connect Wallet & Get Started'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </ConnectButton.Custom>
        </motion.div>
      </section>

      {/* Pain points */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-white/80 mb-10">The problem with healthcare data today</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {painPoints.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                <p className="text-white/50 text-sm">{p.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-white/80 mb-12">How it works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="text-center relative">
              <div className="text-5xl font-black text-primary/20 mb-2">{s.n}</div>
              <div className="text-white font-semibold mb-1">{s.label}</div>
              <div className="text-white/50 text-xs">{s.desc}</div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 right-0 translate-x-1/2 text-primary/30 text-2xl">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-white/80 mb-10">Feature highlights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">{f.title}</div>
                  <div className="text-white/50 text-sm">{f.desc}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to own your health data?</h2>
        <p className="text-white/50 mb-8">No account. No password. Just your wallet.</p>
        <ConnectButton />
      </section>
    </div>
  );
}
