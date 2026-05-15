/**
 * extractor.ts — Phase 4
 * Text extraction from health documents.
 * PDF   → pdfjs-dist (no server, pure WASM)
 * Image → Tesseract.js (WASM OCR, runs in a Web Worker)
 * Both run 100% in the browser — no plaintext ever sent to a server.
 */

// ─── PDF Extraction ──────────────────────────────────────────────────────────
export async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamic import so Next.js doesn't try to bundle the WASM at build time
  const pdfjsLib = await import('pdfjs-dist');
  // Point worker at the CDN copy so it's not bundled
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: { str?: string }) => item.str ?? '').join(' '));
  }

  return pages.join('\n\n');
}

// ─── OCR Extraction ──────────────────────────────────────────────────────────
export async function extractTextFromImage(file: File): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: () => {}, // suppress progress logs
  });
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return data.text;
}

// ─── Unified Dispatcher ──────────────────────────────────────────────────────
export async function extractText(file: File): Promise<string> {
  const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (isPDF)   return extractTextFromPDF(file);
  if (isImage) return extractTextFromImage(file);

  // Fallback: try to read as plain text (e.g. .txt, .csv)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve((e.target?.result as string) ?? '');
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ─── Chunker ─────────────────────────────────────────────────────────────────
/**
 * Splits a long document into overlapping chunks for embedding.
 * Keeps medical context together by splitting on double-newlines first.
 */
export function chunkText(
  text: string,
  maxTokens = 300,
  overlapTokens = 50
): string[] {
  // Rough token estimate: 1 token ≈ 4 chars
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  // Split on paragraph boundaries first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length <= maxChars) {
      current = current ? current + '\n\n' + para : para;
    } else {
      if (current) chunks.push(current.trim());
      // If single paragraph is too long, hard-split it
      if (para.length > maxChars) {
        let pos = 0;
        while (pos < para.length) {
          chunks.push(para.slice(pos, pos + maxChars).trim());
          pos += maxChars - overlapChars;
        }
        current = '';
      } else {
        current = para;
      }
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 20);
}
