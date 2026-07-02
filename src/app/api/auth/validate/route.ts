import { NextRequest, NextResponse } from 'next/server'
import { verifyPasscode } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code: string }
  if (verifyPasscode(code)) return NextResponse.json({ ok: true })
  return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
}
