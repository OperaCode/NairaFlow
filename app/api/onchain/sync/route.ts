import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser, verifySession } from '@/lib/auth'
import { getTransactionsCollection } from '@/lib/db/models'
import { findTransfersToAddressInRange } from '@/lib/onchain'
import { smartSplit } from '@/lib/wallet'

const MONAD_TESTNET_CHAIN_ID = 10143
const DEFAULT_MONAD_EXPLORER_BASE_URL = 'https://testnet.monadexplorer.com'

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

    const user = await getUser(session.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (!user.linkedWalletAddress) {
      return NextResponse.json({ error: 'Please link a wallet in Settings first' }, { status: 400 })
    }

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.TESTNET_RPC_URL || 'https://testnet-rpc.monad.xyz'
    const smartWalletAddress = process.env.NEXT_PUBLIC_SMART_WALLET_ADDRESS
    const explorerBaseUrl =
      process.env.NEXT_PUBLIC_MONAD_EXPLORER_BASE_URL || DEFAULT_MONAD_EXPLORER_BASE_URL

    if (!smartWalletAddress) {
      return NextResponse.json(
        { error: 'Missing Smart Wallet Address in environment config' },
        { status: 500 }
      )
    }

    const { fromBlock } = await request.json().catch(() => ({ fromBlock: undefined }))
    const provider = await import('ethers').then(({ ethers }) => new ethers.JsonRpcProvider(rpcUrl))
    const latestBlock = await provider.getBlockNumber()
    const maxRange = Number(process.env.ONCHAIN_SYNC_MAX_RANGE || 2000)
    const defaultStart = Math.max(0, latestBlock - maxRange)
    const startFrom = Number.isFinite(Number(fromBlock))
      ? Math.max(0, Number(fromBlock))
      : user.lastOnchainSyncBlock ?? defaultStart
    const endAt = Math.min(latestBlock, startFrom + maxRange)

    const allMatches = await findTransfersToAddressInRange(
      user.linkedWalletAddress as string,
      process.env.NEXT_PUBLIC_USDC_TESTNET_TOKEN_ADDRESS || '', // Passed for compatibility
      rpcUrl,
      startFrom,
      endAt
    )
    
    allMatches.sort((a, b) => (a.blockNumber - b.blockNumber) || (a.logIndex - b.logIndex))

    const transactions = await getTransactionsCollection()
    let creditedCount = 0
    let totalUsdCredited = 0
    const creditedTransfers: Array<{
      txHash: string
      blockNumber: number
      amountUsd: number
      tokenAddress: string
      tokenSymbol: 'USDC' | 'USDT'
      explorerUrl: string
    }> = []

    for (const transfer of allMatches) {
      const sourceRef = `onchain:${transfer.txHash.toLowerCase()}:${transfer.logIndex}`
      const existing = await transactions.findOne({ userId: session.userId, sourceRef })
      if (existing) continue

      const tokenSymbol =
        process.env.USDC_TESTNET_TOKEN_ADDRESS &&
        transfer.tokenAddress === process.env.USDC_TESTNET_TOKEN_ADDRESS.toLowerCase()
          ? 'USDC'
          : 'USDT'

      await smartSplit(session.userId, transfer.amountUsd, {
        channel: 'onchain',
        sourceRef,
        metadata: {
          network: 'Monad Testnet',
          chainId: MONAD_TESTNET_CHAIN_ID,
          txHash: transfer.txHash.toLowerCase(),
          blockNumber: transfer.blockNumber,
          logIndex: transfer.logIndex,
          tokenAddress: transfer.tokenAddress,
          tokenSymbol,
        },
      })
      creditedCount += 1
      totalUsdCredited += transfer.amountUsd
      creditedTransfers.push({
        txHash: transfer.txHash.toLowerCase(),
        blockNumber: transfer.blockNumber,
        amountUsd: transfer.amountUsd,
        tokenAddress: transfer.tokenAddress,
        tokenSymbol,
        explorerUrl: `${explorerBaseUrl}/tx/${transfer.txHash.toLowerCase()}`,
      })
    }

    await updateUser(session.userId, { lastOnchainSyncBlock: endAt })

    return NextResponse.json({
      success: true,
      syncedFrom: startFrom,
      syncedTo: endAt,
      latestBlock,
      hasMore: endAt < latestBlock,
      creditedCount,
      totalUsdCredited,
      creditedTransfers,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync on-chain deposits'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
