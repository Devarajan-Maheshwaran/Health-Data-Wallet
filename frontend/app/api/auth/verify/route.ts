/**
 * POST /api/auth/verify
 * Verifies a SIWE message + signature.
 * FIX: session cookie is now HMAC-SHA256 signed (not plain base64) to prevent tampering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { signSession, SESSION_COOKIE } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    if (!message || !signature) {
      return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 });
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { address, chainId } = result.data;
    const token = await signSession({ address, chainId, issuedAt: new Date().toISOString() });

    const response = NextResponse.json({ ok: true, address });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   60 * 60 * 24, // 24 hours
      path:     '/',
    });

    return response;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
