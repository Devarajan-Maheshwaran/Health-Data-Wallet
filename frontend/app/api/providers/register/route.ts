/**
 * POST /api/providers/register — register a new provider (admin-gated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, name, specialty, hospital, licenseNumber } = await req.json();
    if (!walletAddress) return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('providers')
      .upsert({ wallet_address: walletAddress.toLowerCase(), name, specialty, hospital, license_number: licenseNumber })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, provider: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Registration failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
