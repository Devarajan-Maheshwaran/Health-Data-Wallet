/**
 * POST /api/auth/verify
 * Verifies a SIWE (Sign-In With Ethereum) message + signature.
 * Returns a session cookie on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';

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

    // Create a lightweight session payload
    const session = {
      address,
      chainId,
      issuedAt: new Date().toISOString(),
    };

    const response = NextResponse.json({ ok: true, address });
    // Encode session as base64 in a HttpOnly cookie (production: use iron-session or JWT)
    response.cookies.set('medvault-session', Buffer.from(JSON.stringify(session)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
