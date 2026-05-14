import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wallet_address, name, specialty, hospital, license_number } = body;

  if (!wallet_address || !name) {
    return NextResponse.json({ error: 'wallet_address and name are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('providers')
    .upsert({ wallet_address, name, specialty, hospital, license_number })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
