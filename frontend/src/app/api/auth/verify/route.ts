import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json()

    if (!message || !signature) {
      return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 })
    }

    const siweMessage = new SiweMessage(message)
    const { data: fields } = await siweMessage.verify({ signature })

    // Set secure httpOnly session cookie
    const cookieStore = cookies()
    cookieStore.set('medvault-session', JSON.stringify({
      address:  fields.address,
      chainId:  fields.chainId,
      issuedAt: fields.issuedAt,
    }), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    })

    return NextResponse.json({
      ok: true,
      address:  fields.address,
      chainId:  fields.chainId,
      issuedAt: fields.issuedAt,
    })
  } catch (err) {
    console.error('[SIWE verify error]', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
}
