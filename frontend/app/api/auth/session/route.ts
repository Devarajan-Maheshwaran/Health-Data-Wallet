/**
 * GET  /api/auth/session  — returns current session
 * DELETE /api/auth/session — logout (clears cookie)
 */

import { NextRequest, NextResponse } from 'next/server';

function getSession(req: NextRequest) {
  const cookie = req.cookies.get('medvault-session')?.value;
  if (!cookie) return null;
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, ...session });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('medvault-session', '', { maxAge: 0, path: '/' });
  return response;
}
