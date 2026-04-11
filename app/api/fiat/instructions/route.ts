import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getOrCreateFiatInstructions } from '@/lib/fiat'

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

    const instructions = await getOrCreateFiatInstructions(session.userId)

    return NextResponse.json({
      success: true,
      instructions,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch fiat instructions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

