import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { createSavingsGoal, getUserSavingsGoals } from '@/lib/savings-goals'

async function getSessionUserId(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  if (!token) {
    return null
  }

  const session = await verifySession(token)
  return session?.userId || null
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goals = await getUserSavingsGoals(userId)
    return NextResponse.json({ success: true, goals })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch savings goals'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, targetAmount } = await request.json()
    const amount = Number(targetAmount)
    const goal = await createSavingsGoal(userId, String(name || ''), amount)

    return NextResponse.json({ success: true, goal }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create savings goal'
    const status =
      message === 'Goal name is required' || message === 'Target amount must be greater than 0'
        ? 400
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}
