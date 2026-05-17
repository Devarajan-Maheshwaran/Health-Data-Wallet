'use client';

import { ShieldCheck, Database, Brain, Lock, Code, Server, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function DocsPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-primary mb-8 border border-primary/20 bg-primary/5">
          <FileText className="w-4 h-4" />
          Technical Documentation
        </div>
        <h1 className="font-syne text-4xl md:text-5xl font-black text-white mb-6">
          System Architecture & Tech Stack
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed mb-16">
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
// Temporary import for the icon above
import { FileText } from 'lucide-react';
