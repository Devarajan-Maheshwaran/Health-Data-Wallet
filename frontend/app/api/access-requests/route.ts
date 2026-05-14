import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patient_address, requester_address, tier, record_ids, duration_seconds, reason } = body;

  const { data, error } = await supabase
    .from('access_requests')
    .insert({ patient_address, requester_address, tier, record_ids, duration_seconds, reason })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
