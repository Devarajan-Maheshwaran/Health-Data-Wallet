/**
 * POST /api/metadata/index — cache AI-extracted metadata for a record
 * GET  /api/metadata?address=0x... — fetch all metadata for a patient
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientAddress, objectName, documentType, aiExtracted, recordId, version } = body;

    const { data, error } = await supabaseAdmin
      .from('record_metadata_cache')
      .upsert({
        patient_address: patientAddress.toLowerCase(),
        record_id: recordId ?? 0,
        version: version ?? 1,
        ai_extracted: aiExtracted ?? {},
        document_type: String(documentType),
        object_name: objectName,
        indexed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, record: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Index failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('record_metadata_cache')
    .select('*')
    .eq('patient_address', address.toLowerCase())
    .order('indexed_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}
