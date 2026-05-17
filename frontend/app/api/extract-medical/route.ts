import { NextRequest, NextResponse } from 'next/server';

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

async function hfQuery(model: string, payload: object) {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is not configured.');
  }

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error: ${err}`);
  }
  return res.json();
}

// Extract a specific field using QA model
async function extractField(context: string, question: string): Promise<string> {
  try {
    const result = await hfQuery('deepset/roberta-base-squad2', {
      inputs: { question, context },
    });
    const answer = result?.answer ?? '';
    const score = result?.score ?? 0;
    // Only return if confidence is reasonable
    return score > 0.1 ? answer.trim() : '';
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileType = file.type;
    let text = '';

    // Extract text based on file type
    if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfParse = (await import('pdf-parse')).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (fileType.startsWith('image/')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      try {
        const ocrResult = await hfQuery('microsoft/trocr-base-printed', {
          inputs: base64,
        });
        text = Array.isArray(ocrResult)
          ? ocrResult.map((r: any) => r.generated_text || '').join(' ')
          : ocrResult?.generated_text ?? '';
      } catch {
        // Fallback: try vit-gpt2
        const fallback = await hfQuery('nlpconnect/vit-gpt2-image-captioning', {
          inputs: base64,
        });
        text = Array.isArray(fallback)
          ? fallback.map((r: any) => r.generated_text || '').join(' ')
          : '';
      }
    } else if (fileType === 'text/plain') {
      text = await file.text();
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload PDF, image, or text file.' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Could not extract readable text from this document.' },
        { status: 422 }
      );
    }

    // Truncate to avoid token limits (keep first 1500 chars which has header info)
    const context = text.slice(0, 1500);

    // Extract each emergency field via QA model in parallel
    const [bloodType, allergies, currentMeds, conditions, treatingDoctor] =
      await Promise.all([
        extractField(context, 'What is the patient blood type or blood group?'),
        extractField(context, 'What are the patient allergies or allergic reactions?'),
        extractField(context, 'What medications or drugs is the patient currently taking?'),
        extractField(context, 'What chronic conditions or diagnoses does the patient have?'),
        extractField(context, 'Who is the treating doctor or physician and which hospital?'),
      ]);

    return NextResponse.json({
      success: true,
      extracted: {
        bloodType,
        allergies,
        currentMeds,
        conditions,
        treatingDoctor,
      },
      rawTextPreview: context.slice(0, 300),
    });
  } catch (err: any) {
    console.error('[extract-medical] Error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Extraction failed' },
      { status: 500 }
    );
  }
}
