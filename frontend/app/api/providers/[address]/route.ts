import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('wallet_address', params.address.toLowerCase())
    .single();

  if (error) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  return NextResponse.json(data);
}
