import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  if (typeof window !== 'undefined') {
    console.error('Supabase env vars missing — check Vercel environment variables.');
  }
}

/** Client-side Supabase client (uses anon key, respects RLS) */
export const supabase = url && anon ? createClient(url, anon) : null as any;

/** Server-side admin client (bypasses RLS — only use in API routes) */
export const supabaseAdmin = url && service ? createClient(url, service) : null as any;
