import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const raw = cookieStore.get('medvault-session')?.value;
  if (!raw) return NextResponse.json({ authenticated: false });
  try {
    const session = JSON.parse(raw);
    return NextResponse.json({ authenticated: true, ...session });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('medvault-session');
  return NextResponse.json({ ok: true });
}
