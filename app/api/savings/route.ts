import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUser } from '@/lib/auth'
import { getUserTransactions, getUserStats } from '@/lib/wallet'
import { getUserSavingsGoals } from '@/lib/savings-goals'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await verifySession(token)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const user = await getUser(session.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [transactions, stats, goals] = await Promise.all([
      getUserTransactions(session.userId, 20),
      getUserStats(session.userId),
      getUserSavingsGoals(session.userId),
    ])

    return NextResponse.json({
      success: true,
      savings: {
        balance: user.savingsBalance.toFixed(2),
        percentage: user.savingsPercentage,
      },
      stats,
      goals,
      transactions,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch savings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
