'use client';

import { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Brain, 
  Lock, 
  Code, 
  Server, 
  Heart, 
  FileText, 
  AlertCircle, 
  Plus, 
  Minus,
  CheckCircle,
  HelpCircle,
  Flame,
  Search,
  Eye,
  TrendingDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BorderGlow from '@/components/ui/BorderGlow';

const techStackInfo = [
  {
    icon: Database,
    title: 'BNB Greenfield',
    desc: 'Provides decentralised object storage for encrypted medical files. By leveraging Greenfield, we ensure that files cannot be deleted or manipulated by central authorities, and storage is secured cryptographically on-chain.'
  },
  {
    icon: Brain,
    title: 'Transformers.js',
    desc: 'Executes Natural Language Processing locally in the browser via WebAssembly. By doing this, MedVault can extract sensitive medical entities without ever sending unencrypted plain-text data to an external AI API.'
  },
  {
    icon: Lock,
    title: 'Web Crypto API',
    desc: 'Uses AES-256-GCM to encrypt every document client-side before it is sent to BNB Greenfield. The encryption keys are securely derived and stored on-chain tied to your wallet identity.'
  },
  {
    icon: Code,
    title: 'Solidity Smart Contracts',
    desc: 'Our HealthRecordStore and AccessController contracts map object IDs to owners, enforce time-based access constraints, and provide an immutable audit trail of who accessed which record and when.'
  },
  {
    icon: Server,
    title: 'Next.js & Supabase',
    desc: 'Next.js provides a robust React server environment for routing and API endpoints, while Supabase acts as a high-performance off-chain indexer to quickly query record metadata without waiting for blockchain reads.'
  }
];

const problems = [
  {
    id: 1,
    title: 'Your records are scattered across every place that ever treated you',
    stat: '30%',
    statLabel: 'Fragmented Records',
    desc: 'Every hospital, clinic, lab, and pharmacy holds a fragment of your health story — in their own proprietary system, in their own format. According to NHS Digital, approximately 30% of patient records are fragmented across different care settings. For patients with multiple providers, this leads to loss of critical health context.',
  },
  {
    id: 2,
    title: 'You don\'t own your records — the hospital does',
    stat: 'Asset',
    statLabel: 'Corporate Owned',
    desc: 'The moment you walk into a hospital, every data point generated about your body is stored in their system, under their control. Legally and practically, hospitals, insurers, and device manufacturers treat patient data as an asset they hold — not something patients have any real right to export or delete.',
  },
  {
    id: 3,
    title: '"Sharing" has no off switch',
    stat: 'Permanent',
    statLabel: 'No Revocation',
    desc: 'When you send a PDF over WhatsApp or email, you permanently lose control of it. You don\'t know who the recipient forwarded it to. You can\'t revoke access or set it to expire. Your sensitive information lives on other devices forever, exposed to insurance companies or data brokers.',
  },
  {
    id: 4,
    title: 'Duplicate tests waste money and time',
    stat: '10–30%',
    statLabel: 'Unnecessary Tests',
    desc: 'Without access to a complete patient record, healthcare providers routinely re-order tests that have already been done. Estimates put unnecessary duplicate testing at 10–30% of all diagnostic tests in fragmented systems, which means paying twice, waiting again, and unnecessary procedures.',
  },
  {
    id: 5,
    title: 'Emergencies expose the worst failure mode',
    stat: 'Zero',
    statLabel: 'Emergency Access',
    desc: 'An unconscious patient cannot consent to share records. Critical information — blood type, allergies, current medications, DNR instructions, implanted devices — is the most urgent data emergency responders need, yet the least likely to be available when seconds count.',
  }
];

const comparisons = [
  {
    name: 'Print & Carry',
    does: 'You manage physical copies manually.',
    fails: 'Lost, damaged, incomplete, absolutely no version control.'
  },
  {
    name: 'WhatsApp / Email',
    does: 'You send unencrypted screenshots or PDFs.',
    fails: 'No revocation, no encryption, completely unstructured.'
  },
  {
    name: 'Hospital Portals',
    does: 'One hospital app per institution.',
    fails: 'Complete institution silo; zero cross-hospital aggregation.'
  },
  {
    name: 'Apple / Google Health',
    does: 'Aggregates fitness and some wear vitals.',
    fails: 'Not designed for clinical records; still stored in a corporate silo.'
  },
  {
    name: 'ABHA (National ID)',
    does: 'Government-linked central identifiers.',
    fails: 'Centralised architecture; data is still held at the hospital gates.'
  },
  {
    name: 'MedVault',
    does: 'Patient wallet is the single, absolute custodian.',
    fails: 'Zero flaws: Encrypted client-side, time-bound, self-sovereign control.',
    highlight: true
  }
];

export default function DocsPage() {
  const [openProblem, setOpenProblem] = useState<number | null>(null);

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        
        {/* Badge & Title */}
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-primary mb-8 border border-primary/20 bg-primary/5">
          <FileText className="w-4 h-4" />
          MedVault Whitepaper & Docs
        </div>
        
        <h1 className="font-syne text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
          Solving the Health Data Custody Crisis
        </h1>

        {/* Short Version Hero Callout */}
        <div className="relative border border-primary/20 bg-gradient-to-r from-primary/5 to-sky-500/5 rounded-3xl p-8 mb-16 overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Flame className="w-40 h-40 text-primary" />
          </div>
          <div className="relative z-10">
            <h3 className="font-syne font-bold text-white text-lg mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              The Core Thesis
            </h3>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium italic">
              "Medical records today are fragmented across every institution that has ever treated you, stored in formats you can't export, controlled by organisations with financial incentives to retain them, and shared via WhatsApp because no better tool exists. MedVault solves this by making the patient's wallet the single custodian of their health data — records are encrypted in-browser, stored on BNB Greenfield's decentralised storage, and shared via time-limited cryptographic grants that can be revoked at any moment."
            </p>
          </div>
        </div>

        {/* SECTION 1: THE PRACTICAL PROBLEM */}
        <div className="mb-20">
          <h2 className="font-syne text-2xl md:text-3xl font-black text-white mb-4">
            The "just WhatsApp it" Illusion
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Most people think sharing medical records is a solved problem. You got a lab report? Print it. Going to a new doctor? Email the PDF. Emergency abroad? Call your family and hope they can find the file. This feels fine — until it isn't.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: ' формат Fragmented Systems', desc: 'You see a new specialist and hand over a printed ECG from 2022. Because their system cannot read that format, they re-run it—wasting ₹3,000 and 2 hours.' },
              { title: 'Dangerous Drug Interactions', desc: 'A doctor prescribes a medication, completely unaware of your active prescription because it is buried under 3,000 messages in a WhatsApp chat from 2021.' },
              { title: 'Locked ER Data in Silence', desc: 'You are unconscious in an ER. The medical team has no idea about your penicillin allergy because the data resides inside a hospital EHR system they cannot access.' },
              { title: 'Permanent Loss of Control', desc: 'The moment you send a PDF containing your clinical status, you lose control forever. You cannot set it to expire or audit who sees it.' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/20 transition-all flex gap-4">
                <div className="h-6 w-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                  ✕
                </div>
                <div>
                  <h4 className="font-syne font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: FIVE CORE PROBLEMS (ACCORDION CARDS) */}
        <div className="mb-20">
          <h2 className="font-syne text-2xl md:text-3xl font-black text-white mb-2">
            The Five Core Problems
          </h2>
          <p className="text-slate-400 mb-8">
            Click on each structural flaw to see how it impact global health metrics:
          </p>

          <div className="space-y-3">
            {problems.map((p) => {
              const isOpen = openProblem === p.id;
              return (
                <div 
                  key={p.id} 
                  className={`border rounded-2xl transition-all cursor-pointer overflow-hidden ${
                    isOpen ? 'border-primary bg-primary/5' : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setOpenProblem(isOpen ? null : p.id)}
                >
                  <div className="p-6 flex items-center justify-between gap-4 select-none">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-syne text-xs font-bold text-primary tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded">
                          Problem 0{p.id}
                        </span>
                        <span className="text-xs text-rose-400 font-mono font-bold bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded">
                          {p.statLabel}: {p.stat}
                        </span>
                      </div>
                      <h3 className="font-syne font-bold text-white mt-2 leading-snug">{p.title}</h3>
                    </div>
                    <div>
                      {isOpen ? <Minus className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-white/5 text-slate-300 text-sm leading-relaxed">
                          {p.desc}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: WHY EXISTING SOLUTIONS FAIL */}
        <div className="mb-20">
          <h2 className="font-syne text-2xl md:text-3xl font-black text-white mb-2">
            Why Existing Solutions Fail
          </h2>
          <p className="text-slate-400 mb-8">
            Every traditional approach keeps data in corporate or institutional silos.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 font-syne text-sm font-bold text-white">Approach</th>
                  <th className="p-4 font-syne text-sm font-bold text-white">What it does</th>
                  <th className="p-4 font-syne text-sm font-bold text-white">Why it fails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisons.map((c, idx) => (
                  <tr 
                    key={idx} 
                    className={`transition-colors text-sm ${
                      c.highlight ? 'bg-primary/10 text-white font-medium' : 'text-slate-300'
                    }`}
                  >
                    <td className="p-4 font-syne font-bold flex items-center gap-2">
                      {c.highlight && <CheckCircle className="w-4 h-4 text-primary shrink-0 animate-pulse" />}
                      {c.name}
                    </td>
                    <td className="p-4">{c.does}</td>
                    <td className="p-4 text-xs md:text-sm text-slate-400">{c.fails}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: WHAT MEDVAULT CHANGES */}
        <div className="mb-20 bg-gradient-to-br from-primary/10 to-sky-900/10 border border-primary/20 rounded-3xl p-8">
          <h2 className="font-syne text-2xl md:text-3xl font-black text-white mb-6">
            What MedVault Changes
          </h2>
          <div className="space-y-4">
            {[
              { title: 'Zero-Knowledge Uploads', desc: 'Files are encrypted in your browser before ever hitting any node. Decryption is only possible via your secure signature.' },
              { title: 'Cryptographic Permission Grants', desc: 'Decisions are backed by the AccessController smart contract. You decide who, how long, and can revoke permission instantly.' },
              { title: 'Time-Bound Decryption Keys', desc: 'A doctor in any city receives a temporary decryption token. When the contract timer runs out, the access shuts off.' },
              { title: 'Emergency Backup (No Credentials Required)', desc: 'A custom, patient-generated offline QR code encodes critical medical details, giving ER responders instant readings in physical crises.' },
              { title: 'Zero-Network Local AI', desc: 'Your health records are read locally in your browser using WASM. Search, medication analysis, and summaries are completed with zero data leakages.' }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-syne font-bold text-white text-base">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: TECHNICAL ARCHITECTURE & TECH STACK */}
        <div className="mb-20">
          <h2 className="font-syne text-2xl md:text-3xl font-black text-white mb-2">
            Technical Architecture & Stack
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            MedVault is engineered from the ground up to guarantee self-sovereign control over health data. 
            By combining local-first AI, client-side encryption, and decentralised blockchain storage, it 
            resolves the privacy versus utility trade-off in modern medical software.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {techStackInfo.map((tech, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.1 }}
                className="h-full"
              >
                <BorderGlow glowColor="200 80 60" colors={['#38bdf8', '#0284c7', '#0c4a6e']} className="w-full h-full">
                  <div className="bg-[#0f172a] rounded-[inherit] p-6 h-full flex flex-col gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl w-fit">
                      <tech.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-syne text-xl font-bold text-white">{tech.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed flex-1">
                      {tech.desc}
                    </p>
                  </div>
                </BorderGlow>
              </motion.div>
            ))}
          </div>
        </div>

        {/* GitHub Contribution CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
          <Heart className="w-8 h-8 text-rose-500 mx-auto mb-4" />
          <h2 className="font-syne text-2xl font-bold text-white mb-4">Open Source & Community Driven</h2>
          <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
            MedVault is completely open source. We invite security researchers, developers, and healthcare 
            professionals to review our smart contracts, audit our encryption pipeline, and contribute to 
            the future of patient-owned data.
          </p>
          <a
            href="https://github.com/Devarajan-Maheshwaran/Health-Data-Wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Code className="w-5 h-5" />
            View Source on GitHub
          </a>
        </div>
      </motion.div>
    </div>
  );
}
