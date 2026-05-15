/**
 * POST /api/providers/register — register a new provider
 * FIX: requires a valid session cookie; wallet address must match the session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    // Auth guard
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, specialty, hospital, licenseNumber } = await req.json();

    // Wallet address always comes from the verified session — never from the request body
    const walletAddress = session.address.toLowerCase();

    const { data, error } = await supabaseAdmin
      .from('providers')
      .upsert({ wallet_address: walletAddress, name, specialty, hospital, license_number: licenseNumber, verified: false })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, provider: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Registration failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
