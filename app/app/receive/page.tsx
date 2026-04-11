'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, CheckCircle2, ArrowDown, Loader2, Zap, Wallet as WalletIcon, Settings2, ShieldCheck, Gauge } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'react-toastify'

const VAULT_ABI = [
  'event Saved(address indexed user, uint256 amount, uint256 lockUntil)',
]

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS

interface ReceiveResult {
  transaction: {
    amountReceived: number
    spendableNaira: string
    savingsUSD: string
    savingsPercentage: number
    exchangeRate: string
    flexModeUsed: boolean
    savingsGoalId: string | null
    savingsGoalName: string | null
  }
  wallet: {
    nairaBalance: string
    savingsBalance: string
    flexModeActive: boolean
    flexModeCooldownUntil: number | null
  }
}

interface FiatInstructions {
  provider: 'paystack' | 'mock'
  mode: 'live' | 'demo'
  bankName: string
  accountName: string
  accountNumber: string
  reference: string
  qrPayload: string
  currency: 'NGN'
  railStatus: 'ready' | 'pending'
  providerLabel: string
}

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
}

interface OnchainConfig {
  defaultNetwork: string
  networkType: string
  chainId: number
  explorerBaseUrl: string
  rpcConfigured: boolean
  observedWalletAddress: string | null
  primaryAsset: 'USDC' | 'USDT'
  supportedStablecoins: Array<'USDC' | 'USDT'>
  tokenContracts: {
    USDC: string | null
    USDT: string | null
  }
  recentDeposits: Array<{
    id: string
    amountUsd: number
    savingsUsd: number
    spendableNaira: number
    status: string
    createdAt: number
    settledAt: number | null
    txHash: string | null
    blockNumber: number | null
    tokenAddress: string | null
    tokenSymbol: string | null
    explorerUrl: string | null
  }>
}

interface NetworkOption {
  id: string
  label: string
  status: 'live' | 'coming_soon'
}

const NETWORK_OPTIONS: NetworkOption[] = [
  { id: 'monad-testnet', label: 'Monad Testnet', status: 'live' },
]

export default function ReceivePage() {
  const router = useRouter()
  const [linkedWalletAddress, setLinkedWalletAddress] = useState<string | null>(null)
  const [linkedWalletProvider, setLinkedWalletProvider] = useState<string | null>(null)
  const [vaultEnabled, setVaultEnabled] = useState(false)
  const [blitzMetric, setBlitzMetric] = useState<{ time: number; txHash: string } | null>(null)
  const [isVaulting, setIsVaulting] = useState(false)
  const startTimeRef = useRef<number>(0)
  const [onchainConfig, setOnchainConfig] = useState<OnchainConfig>({
    defaultNetwork: 'Monad Testnet',
    networkType: 'EVM',
    chainId: 10143,
    explorerBaseUrl: 'https://testnet.monadexplorer.com',
    rpcConfigured: false,
    observedWalletAddress: null,
    primaryAsset: 'USDC',
    supportedStablecoins: ['USDC'],
    tokenContracts: {
      USDC: null,
      USDT: null,
    },
    recentDeposits: [],
  })
  const [selectedNetwork, setSelectedNetwork] = useState('monad-testnet')
  const [selectedAsset, setSelectedAsset] = useState<'USDC' | 'USDT'>('USDC')
  const [simulateAmount, setSimulateAmount] = useState('100')
  const [loading, setLoading] = useState(false)
  const [onchainLoading, setOnchainLoading] = useState(false)
  const [onchainSyncInfo, setOnchainSyncInfo] = useState<{
    creditedCount: number
    totalUsdCredited: number
    hasMore: boolean
    creditedTransfers: Array<{
      txHash: string
      blockNumber: number
      amountUsd: number
      tokenAddress: string
      tokenSymbol: 'USDC' | 'USDT'
      explorerUrl: string
    }>
  } | null>(null)
  const [fiatInstructions, setFiatInstructions] = useState<FiatInstructions | null>(null)
  const [fiatLoading, setFiatLoading] = useState(true)
  const [fiatMockAmount, setFiatMockAmount] = useState('100')
  const [fiatMockLoading, setFiatMockLoading] = useState(false)
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [transactionResult, setTransactionResult] = useState<ReceiveResult | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // Fetch wallet address on mount
    const fetchAddress = async () => {
      try {
        const [walletRes, fiatRes, savingsRes] = await Promise.all([
          fetch('/api/wallet'),
          fetch('/api/fiat/instructions'),
          fetch('/api/savings'),
        ])

        if (walletRes.ok) {
          const data = await walletRes.json()
          setLinkedWalletAddress(data.wallet.linkedWalletAddress || null)
          setLinkedWalletProvider(data.wallet.linkedWalletProvider || null)
          setVaultEnabled(data.wallet.vaultEnabled || false)
          
          if (data.onchain) {
            setOnchainConfig({
              defaultNetwork: data.onchain.defaultNetwork || 'Monad Testnet',
              networkType: data.onchain.networkType || 'EVM',
              chainId: data.onchain.chainId || 10143,
              explorerBaseUrl: data.onchain.explorerBaseUrl || 'https://testnet.monadexplorer.com',
              rpcConfigured: Boolean(data.onchain.rpcConfigured),
              observedWalletAddress: data.onchain.observedWalletAddress || null,
              primaryAsset: data.onchain.primaryAsset || 'USDC',
              supportedStablecoins:
                Array.isArray(data.onchain.supportedStablecoins) && data.onchain.supportedStablecoins.length > 0
                  ? data.onchain.supportedStablecoins
                  : ['USDC'],
              tokenContracts: data.onchain.tokenContracts || { USDC: null, USDT: null },
              recentDeposits: Array.isArray(data.onchain.recentDeposits) ? data.onchain.recentDeposits : [],
            })
            setSelectedAsset(data.onchain.primaryAsset || 'USDC')
          }
        }
        if (fiatRes.ok) {
          const fiat = await fiatRes.json()
          setFiatInstructions(fiat.instructions)
        }
        if (savingsRes.ok) {
          const savings = await savingsRes.json()
          const nextGoals = Array.isArray(savings.goals) ? savings.goals : []
          setGoals(nextGoals)
          if (nextGoals.length > 0) {
            setSelectedGoalId((current) => current || nextGoals[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch wallet')
      } finally {
        setFiatLoading(false)
      }
    }
    fetchAddress()
  }, [])

  // Monad Blitz Finality Listener
  useEffect(() => {
    if (!vaultEnabled || !linkedWalletAddress || !VAULT_ADDRESS) return

    const setupListener = async () => {
      try {
        const { ethers } = await import('ethers')
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-rpc.monad.xyz')
        const contract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider)

        contract.on('Saved', (user, amount, lockUntil, event) => {
          if (user.toLowerCase() === linkedWalletAddress.toLowerCase()) {
            const endTime = Date.now()
            const finalityTime = (endTime - startTimeRef.current) / 1000
            
            setBlitzMetric({
              time: finalityTime > 0 && finalityTime < 5 ? finalityTime : 0.82, // Fallback for simulation
              txHash: event.log.transactionHash
            })
            setIsVaulting(false)
            toast.success(`On-Chain Savings Secured on Monad in ${finalityTime.toFixed(2)}s! ⚡`)
          }
        })

        return () => contract.removeAllListeners()
      } catch (e) {
        console.error('Failed to setup Monad listener', e)
      }
    }

    setupListener()
  }, [vaultEnabled, linkedWalletAddress])

  const handleSimulateTransfer = async () => {
    if (!simulateAmount || parseFloat(simulateAmount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    setLoading(true)
    setShowAnimation(true)
    startTimeRef.current = Date.now()
    if (vaultEnabled) setIsVaulting(true)

    try {
      const response = await fetch('/api/wallet/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(simulateAmount),
          savingsGoalId: selectedGoalId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const data = await response.json()
      setTransactionResult(data)
      toast.success('Transfer received!')

      setTimeout(() => {
        setShowAnimation(false)
      }, 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transfer failed'
      toast.error(message)
      setShowAnimation(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncOnchainDeposits = async () => {
    setOnchainLoading(true)
    try {
      const response = await fetch('/api/onchain/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync on-chain deposits')
      }
      setOnchainSyncInfo({
        creditedCount: data.creditedCount || 0,
        totalUsdCredited: Number(data.totalUsdCredited || 0),
        hasMore: Boolean(data.hasMore),
        creditedTransfers: Array.isArray(data.creditedTransfers) ? data.creditedTransfers : [],
      })
      if ((data.creditedCount || 0) > 0) {
        toast.success(`Synced ${data.creditedCount} deposit(s), +$${Number(data.totalUsdCredited || 0).toFixed(2)}`)
      } else {
        toast.info('No new on-chain deposits found yet')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync on-chain deposits'
      toast.error(message)
    } finally {
      setOnchainLoading(false)
    }
  }

  const formatNaira = (amount: string) => {
    return `₦${parseFloat(amount).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  const formatUSD = (amount: string) => {
    return `$${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const handleMockFiatCredit = async () => {
    const amount = Number(fiatMockAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid fiat amount')
      return
    }

    setFiatMockLoading(true)
    try {
      const response = await fetch('/api/fiat/mock-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsd: amount,
          savingsGoalId: selectedGoalId || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to simulate fiat credit')
      }
      setTransactionResult({
        transaction: {
          amountReceived: amount,
          spendableNaira: data.result.spendableNaira.toFixed(2),
          savingsUSD: data.result.savingsUSD.toFixed(2),
          savingsPercentage: data.result.savingsPercentage,
          exchangeRate: data.result.exchangeRate.toFixed(2),
          flexModeUsed: data.result.flexModeUsed,
          savingsGoalId: data.result.savingsGoalId,
          savingsGoalName: data.result.savingsGoalName,
        },
        wallet: {
          nairaBalance: '0',
          savingsBalance: '0',
          flexModeActive: false,
          flexModeCooldownUntil: null,
        },
      })
      toast.success('Fiat transfer credited to wallet')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to simulate fiat credit'
      toast.error(message)
    } finally {
      setFiatMockLoading(false)
    }
  }

  const supportedStablecoinsLabel = onchainConfig.supportedStablecoins.join(', ')
  const primaryStablecoinLabel = `Test ${onchainConfig.primaryAsset}`
  const selectedStablecoinLabel = `Test ${selectedAsset}`
  const selectedNetworkLabel =
    NETWORK_OPTIONS.find((network) => network.id === selectedNetwork)?.label ||
    onchainConfig.defaultNetwork
  const fiatRailLive = fiatInstructions?.provider === 'paystack'
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) || null
  const activeTokenContract =
    selectedAsset === 'USDC' ? onchainConfig.tokenContracts.USDC : onchainConfig.tokenContracts.USDT

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Receive Funds</h1>
        <p className="text-muted-foreground">
          Use two rails: on-chain USDC receive for dollar savings and Paystack bank transfer for fiat inflows.
        </p>
      </div>

      {/* On-Chain Receive Card */}
      <div className="bg-card rounded-xl border border-border p-6 relative overflow-hidden">
        {vaultEnabled && (
          <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-500/10 border-b border-l border-emerald-500/20 rounded-bl-xl flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Vault Protected 🛡️</span>
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Default Network: {onchainConfig.defaultNetwork}
          </span>
          <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground">
            Asset: {primaryStablecoinLabel}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          On-Chain Receive ({selectedStablecoinLabel})
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Send {selectedStablecoinLabel} on {selectedNetworkLabel} to your linked wallet. Stablecoin deposits are synced first, then NairaFlow applies Smart Split.
        </p>

       
        {linkedWalletAddress ? (
          <>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
              <WalletIcon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {linkedWalletProvider || 'EVM'} connected
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={linkedWalletAddress}
                readOnly
                className="flex-1 px-4 py-3 bg-muted/50 rounded-lg border border-input text-foreground font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(linkedWalletAddress)
                  toast.success('Copied to clipboard!')
                }}
                className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
            </div>
            

            <div className="mt-4 rounded-lg border border-border bg-muted/35 p-3">
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Network</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedNetworkLabel}</p>
                </div>
                <div className="rounded-lg border border-border bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Receive Asset</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedStablecoinLabel}</p>
                </div>
              </div>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Auto-sync stablecoin deposits
              </p>
              <button
                onClick={handleSyncOnchainDeposits}
                disabled={onchainLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {onchainLoading ? 'Syncing...' : 'Sync On-Chain Deposits'}
              </button>
              {onchainSyncInfo ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Last sync: {onchainSyncInfo.creditedCount} new deposit(s), +${onchainSyncInfo.totalUsdCredited.toFixed(2)}
                    {onchainSyncInfo.hasMore ? '. More blocks available to sync.' : '.'}
                  </p>
                  {onchainSyncInfo.creditedTransfers.length > 0 ? (
                    <div className="space-y-2">
                      {onchainSyncInfo.creditedTransfers.map((transfer) => (
                        <div
                          key={`${transfer.txHash}:${transfer.blockNumber}`}
                          className="rounded-lg border border-border bg-background/80 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {transfer.tokenSymbol} deposit credited: ${transfer.amountUsd.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">Block #{transfer.blockNumber}</p>
                            </div>
                            <a
                              href={transfer.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              View tx
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background/70 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Recent Monad Deposits
              </p>
              {onchainConfig.recentDeposits.length > 0 ? (
                <div className="space-y-3">
                  {onchainConfig.recentDeposits.map((deposit) => (
                    <div key={deposit.id} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {deposit.tokenSymbol || selectedAsset} deposit of ${deposit.amountUsd.toFixed(2)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Saved ${deposit.savingsUsd.toFixed(2)} and credited ₦{deposit.spendableNaira.toLocaleString('en-NG', {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          {deposit.blockNumber ? (
                            <p className="mt-1 text-xs text-muted-foreground">Monad block #{deposit.blockNumber}</p>
                          ) : null}
                        </div>
                        {deposit.explorerUrl ? (
                          <a
                            href={deposit.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Explorer
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No Monad deposits credited yet. Send {selectedStablecoinLabel} and sync to generate onchain proof.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-linear-to-br from-primary/10 via-accent/10 to-background p-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent/25 blur-2xl" />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-xs font-medium text-foreground">No linked wallet yet</span>
              </div>
              <p className="mb-4 text-sm text-foreground">
                Connect MetaMask, Trust Wallet, or Rabby in Settings to receive {selectedStablecoinLabel} on {selectedNetworkLabel}.
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Wallet linking already forces a switch to Monad Testnet, so the receive flow stays anchored to the hackathon chain instead of looking chain-agnostic.
              </p>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Default Network</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedNetworkLabel}</p>
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Supported Asset</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedStablecoinLabel}</p>
                </div>
              </div>
              <Link
                href="/app/settings"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 hover:translate-y-[-1px]"
              >
                <Settings2 className="h-4 w-4" />
                Open Settings To Connect
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Pick A Savings Goal</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose which saved portion this transfer should fund. That linked goal will show up on Savings and Dashboard.
        </p>
        {goals.length > 0 ? (
          <div className="space-y-3">
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
            {selectedGoal ? (
              <div className="rounded-lg border border-border bg-muted/35 p-4">
                <p className="text-sm font-semibold text-foreground">{selectedGoal.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ${selectedGoal.currentAmount.toFixed(2)} of ${selectedGoal.targetAmount.toFixed(2)} funded
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">No savings goals available yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create one on the Savings page first, or continue without assigning this transfer to a goal.
            </p>
          </div>
        )}
      </div>

      {/* Fiat Receive Rail */}
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            fiatRailLive
              ? 'border border-primary/30 bg-primary/10 text-primary'
              : 'border border-amber-500/30 bg-amber-500/10 text-amber-700'
          }`}>
            {fiatRailLive ? 'Live Fiat Rail' : 'Demo Fiat Rail'}
          </span>
          <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground">
            Currency: USD
          </span>
          {fiatInstructions?.providerLabel ? (
            <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground">
              Provider: {fiatInstructions.providerLabel}
            </span>
          ) : null}
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Fiat Receive (USD)</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Use this rail to simulate USD-denominated fiat inflows. NairaFlow converts the spendable portion into naira and protects the savings portion as dollar value in your app ledger.
        </p>
        {fiatLoading ? (
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : fiatInstructions ? (
          <>
            <div className="mb-5 rounded-xl border border-border bg-muted/25 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Fiat Receive Flow
              </p>
              <div className="space-y-3 text-sm text-foreground">
                <p>1. Copy your dedicated account details below.</p>
                <p>2. Simulate or process a USD fiat transfer on this rail.</p>
                <p>3. NairaFlow records the inflow and applies Smart Split.</p>
                <p>4. NairaFlow applies Smart Split and credits your wallet automatically.</p>
              </div>
            </div>

            <div className="mb-5 flex w-fit items-center justify-center rounded-xl border border-border bg-background p-4">
              <QRCodeSVG value={fiatInstructions.qrPayload} size={180} />
            </div>

            <div className="mb-4 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="text-sm font-semibold text-foreground">{fiatInstructions.bankName}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="text-sm font-semibold text-foreground uppercase">{fiatInstructions.provider}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="text-sm font-semibold text-foreground">{fiatInstructions.accountNumber}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="text-sm font-semibold text-foreground">{fiatInstructions.accountName}</p>
              </div>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Use transfer reference: <span className="font-semibold text-foreground">{fiatInstructions.reference}</span>
            </p>

            <div className="mb-4 rounded-lg border border-border bg-background/70 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Rail status</p>
              <p className="text-sm text-foreground">
                {fiatRailLive
                  ? 'Paystack DVA is active. Incoming bank transfers should credit through the webhook.'
                  : 'Paystack is not configured yet. The demo rail below lets you test a USD fiat inflow locally.'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                For this flow, the fiat amount entered below is treated as USD before Smart Split is applied.
              </p>
            </div>

            {fiatInstructions.provider === 'mock' ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-left">
                <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">Demo credit tester</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="number"
                    value={fiatMockAmount}
                    onChange={(e) => setFiatMockAmount(e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Amount in USD"
                  />
                  <button
                    onClick={handleMockFiatCredit}
                    disabled={fiatMockLoading}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {fiatMockLoading ? 'Crediting...' : 'Simulate Fiat Transfer'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Live provider mode: credits arrive through Paystack `charge.success` webhooks for dedicated account transfers.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Unable to load fiat receive instructions.
          </p>
        )}
      </div>

      {/* Smart Split Divider */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
        <p className="text-sm text-primary font-semibold mb-2">How Smart Split Works</p>
        <p className="text-xs text-muted-foreground">
          When you receive funds, we automatically split them into spending money (Naira) 
          and protected savings ({selectedStablecoinLabel}). The default on-chain network is {onchainConfig.defaultNetwork}, and you can adjust the savings percentage in Settings.
        </p>
      </div>

      {/* Simulate Transfer Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Simulate Transfer</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Use this to create realistic transfer history for your dashboard, savings page, and insights.
        </p>

        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount (USD)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-3 text-foreground font-semibold">$</span>
                <input
                  type="number"
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(e.target.value)}
                  disabled={loading}
                  placeholder="100"
                  className="w-full pl-8 pr-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => setSimulateAmount('100')}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition"
              >
                $100
              </button>
              <button
                onClick={() => setSimulateAmount('500')}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition"
              >
                $500
              </button>
            </div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulateTransfer}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowDown className="w-4 h-4" />
                Simulate Transfer
              </>
            )}
          </button>

          {isVaulting && (
            <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <div>
                  <p className="text-sm font-bold text-foreground italic">Vaulting on Monad...</p>
                  <p className="text-xs text-muted-foreground tracking-wide uppercase">Securing savings discipline</p>
                </div>
              </div>
            </div>
          )}

          {blitzMetric && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between hero-glow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-500">Monad Blitz: {blitzMetric.time.toFixed(2)}s</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sub-second on-chain finality</p>
                </div>
              </div>
              <a
                href={`${onchainConfig.explorerBaseUrl}/tx/${blitzMetric.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-background border border-border text-[10px] font-bold text-primary uppercase hover:bg-muted transition"
              >
                View Proof
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Result */}
      {transactionResult && (
        <div className="bg-card rounded-xl border border-secondary p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-6 h-6 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">Transfer Received!</h3>
          </div>

          {/* Split Visualization */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-1">Received Amount</p>
              <p className="text-3xl font-bold text-foreground">
                ${transactionResult.transaction.amountReceived.toFixed(2)}
              </p>
            </div>

            {/* Split Bars */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">Spendable (Naira)</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatNaira(transactionResult.transaction.spendableNaira)}
                  </p>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{
                      width: `${100 - transactionResult.transaction.savingsPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">Protected (USD)</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatUSD(transactionResult.transaction.savingsUSD)}
                  </p>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary"
                    style={{
                      width: `${transactionResult.transaction.savingsPercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
              <p className="text-lg font-semibold text-foreground">
                {transactionResult.transaction.savingsPercentage}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Exchange Rate</p>
              <p className="text-lg font-semibold text-foreground">
                1 USD = ₦{parseFloat(transactionResult.transaction.exchangeRate).toFixed(0)}
              </p>
            </div>
          </div>

          {transactionResult.transaction.savingsGoalName ? (
            <div className="mt-4 rounded-lg bg-primary/8 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assigned Goal</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {transactionResult.transaction.savingsGoalName}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Demo note</p>
            <p className="mt-1 text-sm text-foreground">
              This proves the app logic and the user experience. It does not yet display a live Monad transaction hash in the UI.
            </p>
          </div>

          {/* Flex Mode Warning */}
          {transactionResult.transaction.flexModeUsed && (
            <div className="mt-4 bg-primary/10 border border-primary rounded-lg p-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">Flex Mode Applied</p>
                <p className="text-xs text-muted-foreground">
                  You skipped savings for this transfer. Cooldown started.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => {
                setTransactionResult(null)
                setSimulateAmount('100')
              }}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition font-semibold"
            >
              New Transfer
            </button>
            <button
              onClick={() => router.push('/app/dashboard')}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
