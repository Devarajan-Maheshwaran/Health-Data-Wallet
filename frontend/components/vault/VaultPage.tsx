'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVaultUpload } from '@/hooks/useVaultUpload';
import { useRouter } from 'next/navigation';
import { AIProgress } from './AIProgress';
import { EntityCard } from './EntityCard';
import { DOC_TYPES } from '@/lib/contracts';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HEALTH_RECORD_STORE_ABI } from '@/lib/contracts';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import BorderGlow from '@/components/ui/BorderGlow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Loader2, CheckCircle,
  AlertCircle, RotateCcw, ShieldCheck, ChevronDown,
  Info, Lock, Cpu, AlertTriangle, Filter, Database, LayoutGrid, ListFilter
} from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  extracting:  'Extracting text from document…',
  ner:         'Running biomedical Named Entity Recognition…',
  classifying: 'Classifying document type…',
  encrypting:  'Encrypting with AES-256-GCM in your browser…',
  uploading:   'Uploading encrypted file to BNB Greenfield…',
  confirming:  'Waiting for on-chain transaction confirmation…',
  embedding:   'Building local semantic search index…',
  done:        'Upload complete',
  error:       'An error occurred',
};

function UploadGuidance() {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-sky-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-sky-300">How upload and AI analysis work</span>
        </div>
        <span className="text-xs text-slate-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-xs text-slate-300">
          <div className="flex gap-3">
            <Cpu className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Step 1 — Local browser AI analysis.</strong>{' '}
              Three secure AI steps run entirely in your local browser sandbox: text extraction, 
              biomedical entity detection (medications, conditions), and document classification.
              No health data ever leaves your device.
            </p>
          </div>
          <div className="flex gap-3">
            <Lock className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Step 2 — Symmetric Encryption & Blockchain.</strong>{' '}
              The document is encrypted browser-side using AES-256-GCM. The key is securely derived 
              from your wallet signature. The encrypted cipher-text is saved to Greenfield while its 
              hash is registered on BNB Chain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function VaultPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();

  const {
    analyseFile, confirmUpload, stage, aiProgress,
    aiResult, lastResult, error: uploadError, isUploading, reset,
  } = useVaultUpload();

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overrideType, setOverrideType] = useState<number | null>(null);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Lab Report' | 'Prescription' | 'Discharge Summary' | 'Other'>('All');

  // Load real records dynamically from IndexedDB
  const [realRecords, setRealRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      setLoadingRecords(true);
      const { loadAllChunks } = await import('@/lib/ai/embeddings');
      const chunks = await loadAllChunks();
      
      const recordMap = new Map<number, any>();
      for (const chunk of chunks) {
        if (!recordMap.has(chunk.recordId)) {
          const typeLabel = DOC_TYPES[chunk.docType] || 'Other';
          const dateLabel = new Date(chunk.recordId).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });

          recordMap.set(chunk.recordId, {
            id: chunk.recordId,
            title: chunk.title,
            type: typeLabel,
            date: dateLabel,
            shares: [],
            diagnosis: chunk.text.slice(0, 80) + '...',
            size: `${(chunk.text.length / 102.4).toFixed(2)} KB`,
            lastAccess: 'Never accessed'
          });
        }
      }
      
      setRealRecords(Array.from(recordMap.values()));
    } catch (err) {
      console.error('Failed to load real records:', err);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, stage]);

  // Local Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' | null }>({
    message: '',
    type: null,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'loading') => {
    setToast({ message, type });
    if (type !== 'loading') {
      setTimeout(() => setToast({ message: '', type: null }), 4000);
    }
  };

  const isAnalysing = ['extracting', 'ner', 'classifying'].includes(stage);
  const isUploadPhase = ['encrypting', 'uploading', 'confirming', 'embedding'].includes(stage);
  const isDone = stage === 'done';
  const isError = stage === 'error';
  const hasAIResult = aiResult !== null && !isAnalysing;

  // Real upload pre-validation checks
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // 1. Connection check
    if (!isConnected || !address) {
      showToast('Please connect your wallet to start the upload process.', 'error');
      return;
    }

    // 2. Onboarding check
    const username = localStorage.getItem('medvault_username');
    if (!username) {
      showToast('Please set up your MedVault profile first.', 'error');
      return;
    }

    // 3. File type check
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file format. Only PDF and images (PNG, JPG) are supported.', 'error');
      return;
    }

    // 4. File size check (Max 25MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('File is too large. Maximum supported file size is 25MB.', 'error');
      return;
    }

    reset();
    setSelectedFile(file);
    setOverrideType(null);
    setShowTypeSelect(false);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    
    showToast('Starting in-browser AI pipeline...', 'loading');
    await analyseFile(file);
    setToast({ message: '', type: null }); // clear loading toast
  }, [title, analyseFile, reset, isConnected, address]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    disabled: isAnalysing || isUploadPhase,
  });

  const onConfirm = useCallback(async () => {
    if (!selectedFile || !aiResult) return;
    showToast('Waiting for wallet signature to encrypt...', 'loading');
    try {
      await confirmUpload(selectedFile, title || selectedFile.name, aiResult, overrideType ?? undefined);
      showToast('Document uploaded and stored successfully!', 'success');
    } catch (e) {
      showToast('Encryption signature cancelled or failed.', 'error');
    }
  }, [selectedFile, aiResult, title, overrideType, confirmUpload]);

  const effectiveDocType = overrideType ?? aiResult?.docType ?? 11;
  const docTypeLabel = DOC_TYPES[effectiveDocType] ?? 'Other';

  // Filters the list dynamically based on sidebar choice
  const filteredRecords = selectedFilter === 'All'
    ? realRecords
    : realRecords.filter(r => r.type === selectedFilter || (selectedFilter === 'Other' && !['Lab Report', 'Prescription', 'Discharge Summary'].includes(r.type)));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 mt-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="font-syne text-3xl font-black text-white">Records Vault</h1>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans max-w-2xl bg-white/5 border border-white/10 rounded-xl p-3">
              <strong>How to Use:</strong> Drag and drop medical PDFs or image scans into the processing terminal below. MedVault uses local browser-based deep models (MiniLM & Zero-Shot Classifiers) to parse and index entity data securely on your device. Once processing completes, click 'Encrypt & Upload' to seal your record cryptographically using AES-GCM and store it on BNB Greenfield, recording the ownership hash on the opBNB smart contract.
            </p>
          </div>
        </div>

        {/* Info panel */}
        <UploadGuidance />

        {/* Upload Card */}
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-6 bg-[#111518]/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-syne flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-400 animate-bounce" />
              Upload & Process New Record
            </h2>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">Record Title</label>
              <input
                type="text"
                placeholder="e.g. CBC Blood Panel — May 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary/50 font-medium"
              />
            </div>

            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragActive         ? 'border-sky-400 bg-sky-500/5' :
                isAnalysing         ? 'border-sky-400/50 bg-sky-500/5 cursor-default' :
                hasAIResult         ? 'border-emerald-500/40 bg-emerald-500/5 cursor-default' :
                                      'border-white/10 hover:border-sky-500/40'
              }`}
            >
              <input {...getInputProps()} />

              {!selectedFile && !isAnalysing && (
                <div className="flex flex-col items-center gap-2.5 text-slate-400">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Upload className="h-6 w-6 text-sky-400" />
                  </div>
                  <span className="text-xs font-semibold">
                    {isDragActive ? 'Drop file to start processing' : 'Drag and drop PDF or image here, or click to browse'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Supported formats: PDF, PNG, JPG, JPEG (Max 25MB)</span>
                </div>
              )}

              {selectedFile && !isAnalysing && !hasAIResult && !isDone && (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <FileText className="h-8 w-8 text-sky-400" />
                  <span className="text-xs font-bold font-mono">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
              )}

              {isAnalysing && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                  <span className="text-xs text-sky-300 font-bold font-syne">
                    {STAGE_LABELS[stage] ?? 'Processing…'}
                  </span>
                  <span className="text-[10px] text-slate-500">Analysing sandbox browser local weights</span>
                </div>
              )}

              {hasAIResult && !isDone && !isUploadPhase && (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-300 font-bold font-syne">AI sandbox analysis complete</span>
                  <span className="text-[10px] text-slate-500">Confirm file details and click upload to proceed</span>
                </div>
              )}
            </div>

            {/* AI Progress bar */}
            {(isAnalysing || (aiProgress.step !== 'idle' && aiProgress.step !== 'done')) && (
              <AIProgress progress={aiProgress} />
            )}

            {/* AI Result review block */}
            {hasAIResult && !isDone && !isUploadPhase && aiResult && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Detected Type</p>
                    <p className="text-xs font-bold text-white mt-0.5">{aiResult.docLabel}</p>
                    {aiResult.confidence > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Confidence: {Math.round(aiResult.confidence * 100)}%</p>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowTypeSelect(v => !v)}
                    variant="ghost"
                    className="text-[10px] h-7 px-2.5 font-bold bg-white/5 border border-white/10"
                  >
                    Override <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {showTypeSelect && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-400">Select Document Category</label>
                    <select
                      className="w-full bg-[#111518] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      value={overrideType ?? effectiveDocType}
                      onChange={e => setOverrideType(Number(e.target.value))}
                    >
                      {Object.entries(DOC_TYPES).map(([num, label]) => (
                        <option key={num} value={num} className="bg-[#111518]">{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI-Extracted Diagnostic Entities</p>
                  <EntityCard entities={aiResult.entities} />
                </div>

                <Button
                  onClick={onConfirm}
                  disabled={!title.trim()}
                  className="w-full flex items-center justify-center gap-2 font-bold py-3 text-xs"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Encrypt & Store on Greenfield
                </Button>
              </div>
            )}

            {/* Uploading loading indicators */}
            {isUploadPhase && (
              <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-sky-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{STAGE_LABELS[stage]}</p>
                    <p className="text-[10px] text-slate-400">Encryption running in WebWorker. Do not close tab.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error handling */}
            {isError && uploadError && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs">
                <AlertCircle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-300">Transaction failed</p>
                  <p className="text-[10px] text-rose-300/80 leading-normal mt-0.5">{uploadError}</p>
                </div>
                <button onClick={reset} className="text-slate-400 hover:text-white shrink-0">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Done Screen */}
            {isDone && lastResult && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <p className="font-bold text-emerald-300">Upload successfully verified on BNB Chain!</p>
                </div>
                
                <div className="space-y-1.5 leading-relaxed text-slate-400">
                  <p>Category: <span className="text-white font-semibold">{DOC_TYPES[lastResult.docType]}</span></p>
                  <p className="break-all">Object Hash: <span className="font-mono text-white">{lastResult.cid}</span></p>
                  <p className="break-all">Tx Hash: <span className="font-mono text-white">{lastResult.txHash}</span></p>
                </div>

                <Button onClick={reset} variant="ghost" className="w-full text-xs font-bold bg-white/5 border border-white/10 text-slate-300 hover:text-white">
                  Upload another record
                </Button>
              </div>
            )}
          </div>

          {/* ZONE B — Your Decrypted Records Vault with Sidebar Filter (Right, 60%) */}
          <div className="md:col-span-6 space-y-6">
            
            {/* Decrypted Vault Header */}
            <div className="bg-[#111518]/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white font-syne flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    Secure Decrypted Records
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    AES-GCM decrypted browser-side dynamically when queried.
                  </p>
                </div>

                {/* Filters inline dropdown/button for mobile */}
                <div className="sm:hidden">
                  <select 
                    value={selectedFilter} 
                    onChange={(e) => setSelectedFilter(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                  >
                    <option value="All" className="bg-[#111518]">All Categories</option>
                    <option value="Lab Report" className="bg-[#111518]">Lab Reports</option>
                    <option value="Prescription" className="bg-[#111518]">Prescriptions</option>
                    <option value="Discharge Summary" className="bg-[#111518]">Discharge Summaries</option>
                    <option value="Other" className="bg-[#111518]">Other</option>
                  </select>
                </div>
              </div>

              {/* Sidebar Category Filter + Grid Layout */}
              <div className="flex gap-6">
                
                {/* Desktop Sidebar filter (Left, 30%) */}
                <div className="hidden sm:flex flex-col gap-1.5 w-40 shrink-0 border-r border-white/5 pr-4">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                    <ListFilter className="w-3 h-3" /> Filter Categories
                  </span>
                  {[
                    { label: 'All Documents', key: 'All' },
                    { label: 'Lab Reports', key: 'Lab Report' },
                    { label: 'Prescriptions', key: 'Prescription' },
                    { label: 'Summaries', key: 'Discharge Summary' },
                    { label: 'Other Type', key: 'Other' },
                  ].map((f) => {
                    const active = selectedFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setSelectedFilter(f.key as any)}
                        className={`text-left text-xs px-3 py-2 rounded-xl font-semibold transition-all ${
                          active ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {/* Grid List of records (Right, 70%) */}
                <div className="flex-1 space-y-4">
                  {loadingRecords ? (
                    <div className="space-y-3">
                      {[1, 2].map((n) => (
                        <div key={n} className="h-24 w-full bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-white/5 rounded-2xl">
                      <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="text-xs">No matching files in this category.</p>
                    </div>
                  ) : (
                    filteredRecords.map((rec) => (
                      <div key={rec.id} className="bg-[#111518]/70 border border-white/5 hover:border-white/15 p-4 rounded-2xl flex flex-col justify-between h-44 hover:shadow-[0_0_30px_rgba(56,189,248,0.02)] transition-all group">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-sky-400 font-mono font-bold uppercase tracking-wider">{rec.type}</span>
                            <span className="text-[9px] text-slate-500 font-mono font-semibold">{rec.size}</span>
                          </div>
                          <h3 className="text-xs font-bold text-white mt-1 group-hover:text-primary transition-colors font-mono line-clamp-1">{rec.title}</h3>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{rec.diagnosis}</p>
                        </div>

                        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 font-mono">Uploaded {rec.date}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => router.push(`/access?grantee=0x742d35Cc6634C0532925a3b844Bc454e4438f44e&tier=1&scope=specific&record=${rec.id}`)}
                              className="text-[10px] h-7 px-2.5 font-bold"
                            >
                              Share Record
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.type && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-[#111518]/90 border-white/10 text-sky-400'
            }`}
          >
            {toast.type === 'loading' && (
              <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
