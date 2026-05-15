/**
 * POST /api/access-requests — create a new access request (provider → patient)
 * GET  /api/access-requests?address=0x... — list requests for a patient or provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientAddress, requesterAddress, tier, recordIds, durationSeconds, reason } = body;

    if (!patientAddress || !requesterAddress || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .insert({
        patient_address: patientAddress.toLowerCase(),
        requester_address: requesterAddress.toLowerCase(),
        tier,
        record_ids: recordIds ?? [],
        duration_seconds: durationSeconds ?? null,
        reason: reason ?? '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for the patient
    await supabaseAdmin.from('notifications').insert({
      recipient_address: patientAddress.toLowerCase(),
      type: 'access_request',
      payload: { requestId: data.id, requesterAddress, tier, reason },
      read: false,
    });

    return NextResponse.json({ ok: true, request: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create request';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  const role = req.nextUrl.searchParams.get('role') ?? 'patient'; // 'patient' | 'provider'

  if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });

  const column = role === 'patient' ? 'patient_address' : 'requester_address';
  const { data, error } = await supabaseAdmin
    .from('access_requests')
    .select('*')
    .eq(column, address.toLowerCase())
    .order('requested_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data });
}
