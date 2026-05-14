import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const session = {
      address: fields.data.address,
      chainId: fields.data.chainId,
      issuedAt: fields.data.issuedAt,
    };

    const cookieStore = cookies();
    cookieStore.set('medvault-session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ ok: true, address: session.address });
  } catch (e) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }
}
