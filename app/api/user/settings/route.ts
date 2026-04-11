import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { updateSavingsPercentage } from '@/lib/wallet'

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await verifySession(token)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { savingsPercentage, vaultEnabled, vaultAddress } = await request.json()

    if (savingsPercentage !== undefined) {
      const user = await updateSavingsPercentage(session.userId, savingsPercentage)

      return NextResponse.json({
        success: true,
        message: `Savings percentage updated to ${savingsPercentage}%`,
        savingsPercentage: user.savingsPercentage,
      })
    }

    if (vaultEnabled !== undefined) {
      const { updateUser } = await import('@/lib/auth')
      await updateUser(session.userId, { vaultEnabled, vaultAddress })

      return NextResponse.json({
        success: true,
        message: vaultEnabled ? 'Vault enabled successfully' : 'Vault disabled successfully',
        vaultEnabled,
        vaultAddress,
      })
    }

    return NextResponse.json(
      { error: 'No settings provided' },
      { status: 400 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update settings'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
