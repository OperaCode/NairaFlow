import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUser } from '@/lib/auth'
import { getUserTransactions, getUserStats } from '@/lib/wallet'

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

    const transactions = await getUserTransactions(session.userId, 20)
    const stats = await getUserStats(session.userId)

    return NextResponse.json({
      success: true,
      savings: {
        balance: user.savingsBalance.toFixed(2),
        percentage: user.savingsPercentage,
      },
      stats,
      transactions,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch savings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
