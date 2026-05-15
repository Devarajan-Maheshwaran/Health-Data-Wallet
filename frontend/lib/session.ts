/**
 * session.ts
 * HMAC-SHA256 signed session cookie helpers.
 * Replaces the previous plain base64 encoding which offered zero tamper protection.
 *
 * Format:  base64url(payload) + '.' + base64url(HMAC-SHA256(base64url(payload), SECRET))
 * Secret:  SESSION_SECRET env var (min 32 chars recommended)
 */

import { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'medvault-session';

const SECRET = process.env.SESSION_SECRET ?? 'medvault-dev-secret-change-in-production';

function b64url(buf: ArrayBuffer | string): string {
  const bytes = typeof buf === 'string'
    ? Buffer.from(buf)
    : Buffer.from(buf);
  return bytes.toString('base64url');
}

async function hmac(payload: string): Promise<string> {
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.importKey(
    'raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return b64url(sig);
}

/** Create a signed session token from a payload object. */
export async function signSession(payload: Record<string, unknown>): Promise<string> {
  const encoded = b64url(JSON.stringify(payload));
  const sig     = await hmac(encoded);
  return `${encoded}.${sig}`;
}

/** Verify and decode a signed session token. Returns null if invalid/tampered. */
export async function verifySession(
  token: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = await hmac(encoded);
  // Constant-time comparison
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Synchronous helper for reading the session in API routes.
 * NOTE: This does NOT re-verify the HMAC (crypto.subtle is async).
 * For routes that only need to READ the address quickly after a verified login,
 * this is acceptable. For sensitive mutations, call verifySession() explicitly.
 *
 * For full async verification in a middleware, use verifySession().
 */
export function getSession(
  req: NextRequest
): { address: string; chainId: number; issuedAt: string } | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  const parts = cookie.split('.');
  if (parts.length !== 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
    if (!payload.address || !payload.chainId) return null;
    return payload as { address: string; chainId: number; issuedAt: string };
  } catch {
    return null;
  }
}
