'use client';

/**
 * VaultPage.tsx — Phase 4 (updated)
 * Full AI-powered upload flow:
 *   Drop file → AI analysis (NER + classify) → confirm/override → encrypt + upload
 *
 * Two-shot flow:
 *   1. User drops a file → `analyseFile()` runs AI pipeline
 *   2. AI result shown: detected type + entities
 *   3. User can override document type
 *   4. User clicks "Encrypt & Upload" → `confirmUpload()`
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVaultUpload } from '@/hooks/useVaultUpload';
import { AIProgress } from './AIProgress';
import { EntityCard } from './EntityCard';
import { DOC_TYPES } from '@/lib/contracts';
import {
  Upload, FileText, Loader2, CircleCheck,
  CircleAlert, RotateCcw, ShieldCheck, ChevronDown,
} from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  extracting:  'Extracting text…',
  ner:         'Running biomedical NER…',
  classifying: 'Classifying document…',
  encrypting:  'Encrypting with AES-256-GCM…',
  uploading:   'Uploading to Greenfield…',
  confirming:  'Confirming on-chain…',
  embedding:   'Building vector index…',
  done:        'Complete!',
  error:       'Something went wrong',
};

export function VaultPage() {
  const {
    analyseFile, confirmUpload, stage, aiProgress,
    aiResult, lastResult, error, isUploading, reset,
  } = useVaultUpload();

  const [title, setTitle]                   = useState('');
  const [selectedFile, setSelectedFile]     = useState<File | null>(null);
  const [overrideType, setOverrideType]     = useState<number | null>(null);
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  const isAnalysing = ['extracting', 'ner', 'classifying'].includes(stage);
  const isUploadPhase = ['encrypting', 'uploading', 'confirming', 'embedding'].includes(stage);
  const isDone  = stage === 'done';
  const isError = stage === 'error';
  const hasAIResult = aiResult !== null && !isAnalysing;

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    reset();
    setSelectedFile(file);
    setOverrideType(null);
    setShowTypeSelect(false);
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
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
            Drop a PDF or image — AI extracts, classifies and encrypts it before upload.
          </p>
        </div>

        {/* ── Upload card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Upload New Record</h2>

          {/* Title input */}
          <input
            type="text"
            placeholder="Record title (e.g. CBC Report Jan 2026)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />

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
                <span className="text-sm">
                  {isDragActive ? 'Drop it here!' : 'Drag & drop a PDF or image, or click to browse'}
                </span>
              </div>
            )}

            {selectedFile && !isAnalysing && !hasAIResult && !isDone && (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <FileText className="h-8 w-8 text-sky-400" />
                <span className="text-sm">{selectedFile.name}</span>
              </div>
            )}

            {isAnalysing && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                <span className="text-sm text-sky-300">
                  {STAGE_LABELS[stage] ?? 'Processing…'}
                </span>
              </div>
            )}

            {hasAIResult && !isDone && !isUploadPhase && (
              <div className="flex flex-col items-center gap-2">
                <CircleCheck className="h-8 w-8 text-green-400" />
                <span className="text-sm text-green-300">Analysis complete — confirm below</span>
              </div>
            )}
          </div>

          {/* ── AI Progress ─────────────────────────────────────────── */}
          {(isAnalysing || (aiProgress.step !== 'idle' && aiProgress.step !== 'done')) && (
            <AIProgress progress={aiProgress} />
          )}

          {/* ── AI Result: detected type + entities ─────────────────── */}
          {hasAIResult && !isDone && !isUploadPhase && aiResult && (
            <div className="space-y-4">
              {/* Detected document type */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-xs text-slate-400">Detected document type</p>
                  <p className="text-sm font-medium text-white">{aiResult.docLabel}</p>
                  <p className="text-xs text-sky-400">
                    Mapped to: <span className="font-semibold">{docTypeLabel}</span>
                    {aiResult.confidence > 0 && (
                      <span className="ml-2 text-slate-400">
                        ({Math.round(aiResult.confidence * 100)}% confidence)
                      </span>
                    )}
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
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
                  value={overrideType ?? effectiveDocType}
                  onChange={e => setOverrideType(Number(e.target.value))}
                >
                  {Object.entries(DOC_TYPES).map(([num, label]) => (
                    <option key={num} value={num}>{label}</option>
                  ))}
                </select>
              )}

              {/* Entity display */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  AI-Extracted Entities
                </p>
                <EntityCard entities={aiResult.entities} />
              </div>

              {/* Confirm upload button */}
              <button
                onClick={onConfirm}
                disabled={!title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40"
              >
                <ShieldCheck className="h-4 w-4" />
                Encrypt & Upload to Greenfield
              </button>
            </div>
          )}

          {/* ── Upload in progress ──────────────────────────────────── */}
          {isUploadPhase && (
            <div className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-sky-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-white">{STAGE_LABELS[stage]}</p>
                <p className="text-xs text-slate-400">Do not close this tab</p>
              </div>
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────────── */}
          {isError && error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <CircleAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <button onClick={reset} className="text-xs text-slate-400 hover:text-white">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Success ─────────────────────────────────────────────── */}
          {isDone && lastResult && (
            <div className="space-y-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
              <div className="flex items-center gap-2">
                <CircleCheck className="h-5 w-5 text-green-400" />
                <p className="text-sm font-semibold text-green-300">Uploaded successfully</p>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-slate-400">
                  Type: <span className="text-white">{DOC_TYPES[lastResult.docType]}</span>
                </p>
                <p className="text-slate-400 break-all">
                  Object: <span className="font-mono text-white">{lastResult.cid}</span>
                </p>
                <p className="text-slate-400 break-all">
                  Tx: <span className="font-mono text-white">{lastResult.txHash}</span>
                </p>
              </div>
              <EntityCard entities={lastResult.entities} compact />
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Upload another
              </button>
            </div>
          )}
        </div>

        {/* ── Records list placeholder ────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Your Records</h2>
          <div className="py-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-500">
              Records load from the HealthRecordStore contract after deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
