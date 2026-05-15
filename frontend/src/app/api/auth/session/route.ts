import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest) {
  const cookieStore = cookies()
  const raw = cookieStore.get('medvault-session')?.value
  if (!raw) return NextResponse.json({ session: null })
  try {
    const session = JSON.parse(raw)
    return NextResponse.json({ session })
  } catch {
    return NextResponse.json({ session: null })
  }
}

export async function DELETE(_req: NextRequest) {
  const cookieStore = cookies()
  cookieStore.delete('medvault-session')
  return NextResponse.json({ ok: true })
}
