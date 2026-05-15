/**
 * GET /api/providers/search?name=... — search providers by name or specialty
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('name') ?? '';

  const { data, error } = await supabaseAdmin
    .from('providers')
    .select('wallet_address, name, specialty, hospital, verified')
    .or(`name.ilike.%${q}%,specialty.ilike.%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ providers: data });
}
