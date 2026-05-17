import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Client will fail if used.');
}

/** Client-side Supabase client (uses anon key, respects RLS) */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Server-side admin client (bypasses RLS — only use in API routes) */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
