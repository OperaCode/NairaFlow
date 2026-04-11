import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { deactivateFlexMode } from '@/lib/wallet'

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

    const result = await deactivateFlexMode(session.userId)

    return NextResponse.json({
      success: true,
      message: 'Flex Mode deactivated.',
      flexModeActive: result.flexModeActive,
      flexModeCooldownUntil: result.flexModeCooldownUntil,
      updatedAt: Date.now(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deactivate flex mode'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
