import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { receiveFiat } from '@/lib/wallet'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await verifySession(token)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { amountNaira } = await request.json()
    const amount = Number(amountNaira)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amountNaira' }, { status: 400 })
    }

    const result = await receiveFiat(session.userId, amount)
    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to credit fiat payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
