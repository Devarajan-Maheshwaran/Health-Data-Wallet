/**
 * PATCH /api/access-requests/:id — update status (approved | rejected | expired)
 * FIX: verify that the caller's session address matches the patient_address on the request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth guard — must be logged in
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status } = await req.json();
    if (!['approved', 'rejected', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Ownership check — fetch the request first
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('access_requests')
      .select('patient_address')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (existing.patient_address !== session.address.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, request: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
