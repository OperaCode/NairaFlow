import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUser } from '@/lib/auth'
import { smartSplit } from '@/lib/wallet'

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

    const { amount, savingsGoalId } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const result = await smartSplit(session.userId, amount, {
      savingsGoalId: typeof savingsGoalId === 'string' ? savingsGoalId : null,
    })
    const user = await getUser(session.userId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      transaction: {
        amountReceived: amount,
        spendableNaira: result.spendableNaira.toFixed(2),
        savingsUSD: result.savingsUSD.toFixed(2),
        savingsPercentage: result.savingsPercentage,
        exchangeRate: result.exchangeRate.toFixed(2),
        flexModeUsed: result.flexModeUsed,
        fxProvider: result.fxProvider,
        fxQuoteTimestamp: result.fxQuoteTimestamp,
        fxQuoteStale: result.fxQuoteStale,
        savingsGoalId: result.savingsGoalId,
        savingsGoalName: result.savingsGoalName,
      },
      wallet: {
        nairaBalance: user.nairaBalance.toFixed(2),
        savingsBalance: user.savingsBalance.toFixed(2),
        flexModeActive: user.flexModeActive,
        flexModeCooldownUntil: user.flexModeCooldownUntil,
        flexModeAvailable:
          !user.flexModeCooldownUntil || user.flexModeCooldownUntil <= Date.now(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to receive funds'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
