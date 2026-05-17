'use client';

/**
 * VaultPage.tsx — Phase 4 (updated)
 * Full AI-powered upload flow with detailed user guidance.
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVaultUpload } from '@/hooks/useVaultUpload';
import { useRouter } from 'next/navigation';
import { AIProgress } from './AIProgress';
import { EntityCard } from './EntityCard';
import { DOC_TYPES } from '@/lib/contracts';
import {
  Upload, FileText, Loader2, CircleCheck,
  CircleAlert, RotateCcw, ShieldCheck, ChevronDown,
  Info, Lock, Cpu, AlertTriangle,
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
    <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-sky-400 flex-shrink-0" />
          <span className="text-sm font-medium text-sky-300">How upload and AI analysis work</span>
        </div>
        <span className="text-xs text-slate-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <div className="flex gap-3">
            <Cpu className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Step 1 — AI analysis (local).</strong>{' '}
              When you drop a file, three AI steps run entirely in your browser:
              text extraction from the PDF or image,
              biomedical Named Entity Recognition (NER) to find diseases, medications, and lab values,
              and zero-shot document classification (e.g. Lab Report, Prescription, Discharge Summary).
              Nothing is sent to any server during this phase.
            </p>
          </div>
          <div className="flex gap-3">
            <Lock className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Step 2 — Encrypt and upload.</strong>{' '}
              After you review the AI results and confirm, the file is encrypted with AES-256-GCM
              using a key derived from your wallet signature. The encrypted blob (not the original file)
              is then uploaded to BNB Greenfield decentralised storage, and the metadata is recorded
              on-chain via the HealthRecordStore smart contract.
            </p>
          </div>
          <div className="flex gap-3">
            <CircleCheck className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Supported formats.</strong>{' '}
              PDF files and images (PNG, JPG, JPEG) up to the Greenfield object size limit.
              Scanned documents work — the pipeline includes OCR fallback for image-based PDFs.
            </p>
          </div>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
            <div className="flex gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-200/70 text-xs">
                This is a testnet deployment. Do not upload real personal health data.
                AI entity extraction may produce inaccurate results — review and correct before confirming.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function VaultPage() {
  const router = useRouter();
  const {
    analyseFile, confirmUpload, stage, aiProgress,
    aiResult, lastResult, error, isUploading, reset,
  } = useVaultUpload();

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overrideType, setOverrideType] = useState<number | null>(null);
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  const isAnalysing = ['extracting', 'ner', 'classifying'].includes(stage);
  const isUploadPhase = ['encrypting', 'uploading', 'confirming', 'embedding'].includes(stage);
  const isDone = stage === 'done';
  const isError = stage === 'error';
  const hasAIResult = aiResult !== null && !isAnalysing;

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    reset();
    setSelectedFile(file);
    setOverrideType(null);
    setShowTypeSelect(false);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    await analyseFile(file);
  }, [title, analyseFile, reset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    disabled: isAnalysing || isUploadPhase,
  });

  const onConfirm = useCallback(async () => {
    if (!selectedFile || !aiResult) return;
    await confirmUpload(selectedFile, title || selectedFile.name, aiResult, overrideType ?? undefined);
  }, [selectedFile, aiResult, title, overrideType, confirmUpload]);

  const effectiveDocType = overrideType ?? aiResult?.docType ?? 11;
  const docTypeLabel = DOC_TYPES[effectiveDocType] ?? 'Other';

  return (
    <div className="min-h-screen bg-[#0A0F1E] px-4 pt-24 pb-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Records Vault</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Upload medical PDFs or images. The AI pipeline extracts entities and classifies the document
            entirely in your browser before encrypting and storing it on the blockchain.
          </p>
        </div>

        <UploadGuidance />

        {/* Upload card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Upload New Record</h2>

          {/* Title input */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Record title</label>
            <input
              type="text"
              placeholder="e.g. CBC Blood Panel — January 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
            />
          </div>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
              isDragActive         ? 'border-sky-400 bg-sky-500/5' :
              isAnalysing         ? 'border-sky-400/50 bg-sky-500/5 cursor-default' :
              hasAIResult         ? 'border-green-500/40 bg-green-500/5 cursor-default' :
                                    'border-white/10 hover:border-sky-500/40'
            }`}
          >
            <input {...getInputProps()} />

            {!selectedFile && !isAnalysing && (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Upload className="h-10 w-10" />
                <span className="text-sm font-medium">
                  {isDragActive ? 'Drop your file here' : 'Drag and drop a PDF or image here, or click to browse'}
                </span>
                <span className="text-xs text-slate-500">Supported: PDF, PNG, JPG, JPEG</span>
              </div>
            )}

            {selectedFile && !isAnalysing && !hasAIResult && !isDone && (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <FileText className="h-8 w-8 text-sky-400" />
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
              </div>
            )}

            {isAnalysing && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                <span className="text-sm text-sky-300 font-medium">
                  {STAGE_LABELS[stage] ?? 'Processing…'}
                </span>
                <span className="text-xs text-slate-500">Running entirely in your browser</span>
              </div>
            )}

            {hasAIResult && !isDone && !isUploadPhase && (
              <div className="flex flex-col items-center gap-2">
                <CircleCheck className="h-8 w-8 text-green-400" />
                <span className="text-sm text-green-300 font-medium">AI analysis complete</span>
                <span className="text-xs text-slate-500">Review the results below and confirm to upload</span>
              </div>
            )}
          </div>

          {/* AI Progress */}
          {(isAnalysing || (aiProgress.step !== 'idle' && aiProgress.step !== 'done')) && (
            <AIProgress progress={aiProgress} />
          )}

          {/* AI Result */}
          {hasAIResult && !isDone && !isUploadPhase && aiResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Detected document type</p>
                  <p className="text-sm font-semibold text-white">{aiResult.docLabel}</p>
                  <p className="text-xs text-sky-400 mt-0.5">
                    On-chain category: <span className="font-semibold">{docTypeLabel}</span>
                    {aiResult.confidence > 0 && (
                      <span className="ml-2 text-slate-400">
                        ({Math.round(aiResult.confidence * 100)}% confidence)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    If the detected type is incorrect, use the Override button to select the right category.
                  </p>
                </div>
                <button
                  onClick={() => setShowTypeSelect(v => !v)}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                >
                  Override <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {showTypeSelect && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Select correct document type</label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
                    value={overrideType ?? effectiveDocType}
                    onChange={e => setOverrideType(Number(e.target.value))}
                  >
                    {Object.entries(DOC_TYPES).map(([num, label]) => (
                      <option key={num} value={num}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  AI-Extracted Medical Entities
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  These entities were identified from the document text. They are stored locally for AI search and are not uploaded to the blockchain.
                </p>
                <EntityCard entities={aiResult.entities} />
              </div>

              {!title.trim() && (
                <p className="text-xs text-yellow-400">Enter a record title above before uploading.</p>
              )}

              <button
                onClick={onConfirm}
                disabled={!title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="h-4 w-4" />
                Encrypt and Upload to BNB Greenfield
              </button>
            </div>
          )}

          {/* Upload in progress */}
          {isUploadPhase && (
            <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-sky-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">{STAGE_LABELS[stage]}</p>
                  <p className="text-xs text-slate-400">Do not close or refresh this tab</p>
                </div>
              </div>
              {stage === 'confirming' && (
                <p className="text-xs text-slate-500 pl-8">
                  Waiting for the BNB Greenfield Testnet transaction to be mined. This can take 15-60 seconds.
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {isError && error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <CircleAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-300 font-medium mb-0.5">Upload failed</p>
                <p className="text-xs text-red-300/70">{error}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Common causes: wallet not connected, insufficient testnet BNB for gas,
                  Greenfield storage bucket not initialised, or network timeout.
                </p>
              </div>
              <button onClick={reset} className="text-xs text-slate-400 hover:text-white">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Success */}
          {isDone && lastResult && (
            <div className="space-y-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
              <div className="flex items-center gap-2">
                <CircleCheck className="h-5 w-5 text-green-400" />
                <p className="text-sm font-semibold text-green-300">Record uploaded successfully</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <p className="text-slate-400">
                  Document type: <span className="text-white">{DOC_TYPES[lastResult.docType]}</span>
                </p>
                <p className="text-slate-400 break-all">
                  Greenfield object ID: <span className="font-mono text-white">{lastResult.cid}</span>
                </p>
                <p className="text-slate-400 break-all">
                  Transaction hash: <span className="font-mono text-white">{lastResult.txHash}</span>
                </p>
                <p className="text-slate-400">
                  The record is now stored on BNB Greenfield and registered in the HealthRecordStore contract.
                  You can grant access to other wallet addresses from the Access Control page.
                </p>
              </div>
              <EntityCard entities={lastResult.entities} compact />
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Upload another record
              </button>
            </div>
          )}
        </div>

        {/* Records list card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Your Decrypted Records Vault</h2>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              End-to-End Private
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            All records are encrypted using browser keys. Pushing a share transaction generates an active cryptographic key mapping on-chain.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { id: 1, title: 'Fictional_Diabetes_Medical_Report.pdf', type: 'Lab Report', date: 'May 15, 2026', shares: ['Dr. Ethan Clarke'], diagnosis: 'Type 2 Diabetes Mellitus · HbA1c 8.4%', size: '345 KB', lastAccess: 'Dr. Ethan Clarke — 2 hours ago' },
              { id: 2, title: 'Blood_Chemistry_May_2026.pdf', type: 'Lab Report', date: 'May 12, 2026', shares: ['Dr. Ethan Clarke'], diagnosis: 'Hyperlipidemia · Normal Renal Function', size: '298 KB', lastAccess: 'Dr. Ethan Clarke — 4 hours ago' },
              { id: 3, title: 'Cardiology_Consultation.pdf', type: 'Discharge Summary', date: 'April 20, 2026', shares: [], diagnosis: 'Mitral Valve Prolapse · Regurgitation Minor', size: '512 KB', lastAccess: 'Never accessed' }
            ].map((rec) => {

              const handleShare = () => {
                router.push(`/access?grantee=0x742d35Cc6634C0532925a3b844Bc454e4438f44e&tier=2&scope=specific&record=${rec.id}`);
              };

              return (
                <div key={rec.id} className="bg-[#111518]/60 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex flex-col justify-between h-48 hover:shadow-[0_0_30px_rgba(56,189,248,0.02)] transition-all group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider">{rec.type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{rec.size}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1 group-hover:text-primary transition-colors font-mono line-clamp-1">{rec.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">{rec.diagnosis}</p>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Uploaded {rec.date}</span>
                      {rec.shares.length > 0 ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                          Shared with {rec.shares.length} person
                        </span>
                      ) : (
                        <span className="text-slate-500">Not shared</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Last accessed: {rec.lastAccess}</span>
                      <button
                        onClick={handleShare}
                        className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-bold px-3 py-1 rounded-lg transition-all"
                      >
                        Share with Dr...
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
