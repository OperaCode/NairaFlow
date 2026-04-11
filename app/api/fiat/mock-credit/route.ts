import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { receiveFiatUsd } from '@/lib/wallet'

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

    const { amountUsd, savingsGoalId } = await request.json()
    const amount = Number(amountUsd)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amountUsd' }, { status: 400 })
    }

    const result = await receiveFiatUsd(
      session.userId,
      amount,
      null,
      typeof savingsGoalId === 'string' ? savingsGoalId : null
    )
    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to credit fiat payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
