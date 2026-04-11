import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser, verifySession } from '@/lib/auth'
import { getUsersCollection } from '@/lib/db/models'

function isValidEvmAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

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

    const { address, providerName } = await request.json()
    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    const normalizedAddress = address.trim()
    if (!isValidEvmAddress(normalizedAddress)) {
      return NextResponse.json({ error: 'Invalid EVM wallet address format' }, { status: 400 })
    }

    const users = await getUsersCollection()
    const existingLinkedUser = await users.findOne({
      linkedWalletAddress: { $regex: `^${normalizedAddress}$`, $options: 'i' },
      id: { $ne: session.userId },
    })

    if (existingLinkedUser) {
      return NextResponse.json({ error: 'This wallet is already linked to another account' }, { status: 409 })
    }

    const updatedUser = await updateUser(session.userId, {
      linkedWalletAddress: normalizedAddress,
      linkedWalletProvider: typeof providerName === 'string' ? providerName : null,
    })

    return NextResponse.json({
      success: true,
      linkedWalletAddress: updatedUser.linkedWalletAddress,
      linkedWalletProvider: updatedUser.linkedWalletProvider,
      message: 'External wallet linked successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to link wallet'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
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

    if (!user.linkedWalletAddress) {
      return NextResponse.json({ error: 'No linked wallet to remove' }, { status: 400 })
    }

    await updateUser(session.userId, {
      linkedWalletAddress: null,
      linkedWalletProvider: null,
    })

    return NextResponse.json({
      success: true,
      message: 'External wallet unlinked successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unlink wallet'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
