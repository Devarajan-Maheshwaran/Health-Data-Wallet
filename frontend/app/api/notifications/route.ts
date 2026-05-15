/**
 * GET  /api/notifications?address=0x...  — fetch notifications for an address
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('recipient_address', address.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}
