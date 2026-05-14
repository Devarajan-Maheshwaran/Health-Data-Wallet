'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useVaultUpload } from '@/hooks/useVaultUpload';
import { DOC_TYPES } from '@/lib/contracts';
import { Upload, FileText, Loader2 } from 'lucide-react';

export function VaultPage() {
  const [title, setTitle] = useState('');
  const { upload, isUploading, lastResult, error } = useVaultUpload();

  const onDrop = useCallback((files: File[]) => {
    if (files[0] && title) upload(files[0], title);
  }, [title, upload]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-textPrimary">Records Vault</h1>

        {/* Upload card */}
        <Card>
          <CardHeader><CardTitle>Upload New Record</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Record title (e.g. CBC Report Jan 2026)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
              />

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/30'
                }`}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3 text-primary">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-sm">Extracting text → AI analysis → Encrypting → Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white/40">
                    <Upload className="w-10 h-10" />
                    <span className="text-sm">
                      {isDragActive ? 'Drop it here' : 'Drag & drop a PDF or image, or click to browse'}
                    </span>
                    {acceptedFiles[0] && !isUploading && (
                      <span className="text-xs text-primary">{acceptedFiles[0].name}</span>
                    )}
                  </div>
                )}
              </div>

              {!isUploading && acceptedFiles[0] && (
                <Button onClick={() => acceptedFiles[0] && title && upload(acceptedFiles[0], title)} className="w-full">
                  Encrypt & Upload
                </Button>
              )}

              {error && <p className="text-danger text-sm">{error}</p>}

              {lastResult && (
                <div className="glass rounded-xl p-4 space-y-2">
                  <p className="text-success text-sm font-semibold">✅ Uploaded successfully</p>
                  <p className="text-white/50 text-xs">Type detected: <span className="text-primary">{DOC_TYPES[lastResult.docType]}</span></p>
                  <p className="text-white/50 text-xs">CID: <span className="font-mono text-white/70">{lastResult.cid}</span></p>
                  {lastResult.entities && (
                    <div className="mt-3">
                      <p className="text-white/50 text-xs mb-2">AI-extracted entities:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(lastResult.entities).flatMap(([k, v]) =>
                          (v as string[]).map((item: string) => (
                            <Badge key={item} variant="info">{item}</Badge>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Records list placeholder */}
        <Card>
          <CardHeader><CardTitle>Your Records</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-12 text-white/30">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Records load from on-chain after contract deployment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
