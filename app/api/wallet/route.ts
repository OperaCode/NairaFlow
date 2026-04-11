import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getUser } from '@/lib/auth'
import { getRecentDeposits } from '@/lib/wallet'

const MONAD_TESTNET_CHAIN_ID = 10143
const DEFAULT_MONAD_EXPLORER_BASE_URL = 'https://testnet.monadexplorer.com'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
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

    const now = Date.now()
    const flexModeAvailable =
      !user.flexModeCooldownUntil || user.flexModeCooldownUntil <= now
    const explorerBaseUrl =
      process.env.NEXT_PUBLIC_MONAD_EXPLORER_BASE_URL || DEFAULT_MONAD_EXPLORER_BASE_URL
    const supportedStablecoins = [
      process.env.USDC_TESTNET_TOKEN_ADDRESS ? 'USDC' : null,
      process.env.USDT_TESTNET_TOKEN_ADDRESS ? 'USDT' : null,
    ].filter((token): token is 'USDC' | 'USDT' => Boolean(token))
    const recentOnchainDeposits = await getRecentDeposits(session.userId, { rail: 'onchain', limit: 5 })

    return NextResponse.json({
      success: true,
      wallet: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        linkedWalletAddress: user.linkedWalletAddress || null,
        linkedWalletProvider: user.linkedWalletProvider || null,
        nairaBalance: user.nairaBalance.toFixed(2),
        usdBalance: user.usdBalance.toFixed(2),
        savingsBalance: user.savingsBalance.toFixed(2),
        savingsPercentage: user.savingsPercentage,
        vaultEnabled: user.vaultEnabled,
        vaultAddress: user.vaultAddress,
        flexModeActive: user.flexModeActive,
        flexModeCooldownUntil: user.flexModeCooldownUntil,
        flexModeAvailable,
      },
      onchain: {
        defaultNetwork: 'Monad Testnet',
        networkType: 'EVM',
        chainId: MONAD_TESTNET_CHAIN_ID,
        explorerBaseUrl,
        rpcConfigured: Boolean(process.env.TESTNET_RPC_URL),
        observedWalletAddress: user.linkedWalletAddress || null,
        primaryAsset: supportedStablecoins.includes('USDC') ? 'USDC' : supportedStablecoins[0] || 'USDC',
        supportedStablecoins,
        tokenContracts: {
          USDC: process.env.USDC_TESTNET_TOKEN_ADDRESS || null,
          USDT: process.env.USDT_TESTNET_TOKEN_ADDRESS || null,
        },
        recentDeposits: recentOnchainDeposits.map((deposit) => {
          const metadataTxHash =
            typeof deposit.metadata?.txHash === 'string' ? deposit.metadata.txHash : null
          const fallbackTxHash =
            typeof deposit.sourceRef === 'string' && deposit.sourceRef.startsWith('onchain:')
              ? deposit.sourceRef.split(':')[1]
              : null
          const txHash = metadataTxHash || fallbackTxHash

          return {
            id: deposit.id,
            amountUsd: Number(deposit.amountUsd.toFixed(2)),
            savingsUsd: Number((deposit.settlement?.savingsUSD || 0).toFixed(2)),
            spendableNaira: Number((deposit.settlement?.spendableNaira || 0).toFixed(2)),
            status: deposit.status,
            createdAt: deposit.createdAt,
            settledAt: deposit.settledAt,
            txHash,
            blockNumber:
              typeof deposit.metadata?.blockNumber === 'number' ? deposit.metadata.blockNumber : null,
            tokenAddress:
              typeof deposit.metadata?.tokenAddress === 'string' ? deposit.metadata.tokenAddress : null,
            tokenSymbol:
              typeof deposit.metadata?.tokenSymbol === 'string' ? deposit.metadata.tokenSymbol : null,
            explorerUrl: txHash ? `${explorerBaseUrl}/tx/${txHash}` : null,
          }
        }),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch wallet'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
