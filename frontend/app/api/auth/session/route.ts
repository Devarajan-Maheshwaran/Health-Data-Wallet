/**
 * GET    /api/auth/session  — returns current session
 * DELETE /api/auth/session  — logout (clears cookie)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, SESSION_COOKIE } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, ...session });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
