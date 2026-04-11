'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Loader2, Send, Target, TrendingUp, Vault, Zap, Wallet as WalletIcon, Settings2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { SavingsGoal, Transaction, Wallet } from './Types'

interface DashboardData {
  wallet: Wallet
  stats: {
    totalReceived: number
    totalSaved: number
    averageSavingsPercentage: number
    transactionCount: number
  }
  goals: SavingsGoal[]
  transactions: Transaction[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const [walletResponse, savingsResponse] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/savings'),
      ])

      if (!walletResponse.ok || !savingsResponse.ok) {
        throw new Error('Failed to load dashboard')
      }

      const walletData = await walletResponse.json()
      const savingsData = await savingsResponse.json()

      setData({
        wallet: walletData.wallet,
        stats: savingsData.stats,
        goals: savingsData.goals || [],
        transactions: savingsData.transactions,
      })
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatNaira = (amount: string | number) =>
    `₦${Number(amount).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`

  const formatUSD = (amount: string | number) =>
    `$${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="mb-2 font-semibold text-foreground">Unable to load dashboard</p>
        <p className="mb-4 text-muted-foreground">Please try refreshing the page</p>
        <button
          onClick={fetchDashboard}
          className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:opacity-90"
        >
          Retry
        </button>
      </div>
    )
  }

  const { wallet, stats, goals, transactions } = data
  const latestTransaction = transactions[0]

  return (
    <div className="space-y-6">
      <div className="hero-glow rounded-[28px] bg-linear-to-br from-primary to-accent p-8 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.24em] opacity-75">Demo narrative</p>
        <h1 className="mt-3 text-3xl font-semibold">Your remittance now has a default behavior.</h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Incoming stablecoins are split into instant naira liquidity and protected dollar savings, with Flex Mode available for exceptions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="surface-panel rounded-[24px] p-6">
          <p className="mb-1 text-sm text-muted-foreground">Spendable Balance</p>
          <h2 className="mb-4 text-3xl font-semibold text-foreground">
            {formatNaira(wallet.nairaBalance)}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/spend"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
            >
              Spend
            </Link>
            <Link
              href="/app/receive"
              className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-primary transition hover:bg-primary/20"
            >
              <Send className="h-4 w-4" />
              Receive Funds
            </Link>
          </div>
        </div>

        <div className="surface-panel rounded-[24px] p-6">
          <p className="mb-1 text-sm text-muted-foreground">Protected Savings</p>
          <h2 className="mb-4 text-3xl font-semibold text-foreground">
            {formatUSD(wallet.savingsBalance)}
          </h2>
          <Link
            href="/app/savings"
            className="inline-flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-2 text-secondary transition hover:bg-secondary/20"
          >
            <Vault className="h-4 w-4" />
            View Vault
          </Link>
        </div>

        <div className="surface-panel rounded-[24px] p-6">
          <p className="mb-1 text-sm text-muted-foreground">Auto-Save Rate</p>
          <h2 className="mb-4 text-3xl font-semibold text-foreground">{wallet.savingsPercentage}%</h2>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-accent" style={{ width: `${wallet.savingsPercentage}%` }} />
            </div>
            <Link href="/app/settings" className="text-xs text-primary hover:underline">
              Edit
            </Link>
          </div>
        </div>
      </div>

      {wallet.flexModeActive ? (
        <div className="rounded-[24px] border border-primary bg-primary/10 p-5">
          <p className="font-semibold text-primary">Flex Mode Active</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your next inbound deposit will skip savings once. After that, Flex Mode turns off and cooldown begins.
          </p>
        </div>
      ) : wallet.flexModeCooldownUntil && wallet.flexModeCooldownUntil > Date.now() ? (
        <div className="rounded-[24px] border border-border bg-muted/40 p-5">
          <p className="font-semibold text-foreground">Flex Mode Cooling Down</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Available again on{' '}
            {new Date(wallet.flexModeCooldownUntil).toLocaleString('en-NG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            .
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="surface-panel rounded-[24px] p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Total Received</p>
              <h3 className="text-2xl font-semibold text-foreground">{formatUSD(stats.totalReceived)}</h3>
            </div>
            <ArrowUpRight className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.transactionCount > 0
              ? `${stats.transactionCount} transfer${stats.transactionCount === 1 ? '' : 's'} processed`
              : 'No transfers yet'}
          </p>
        </div>

        <div className="surface-panel rounded-[24px] p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Total Saved</p>
              <h3 className="text-2xl font-semibold text-foreground">{formatUSD(stats.totalSaved)}</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-xs text-muted-foreground">
            Average savings rate: {stats.averageSavingsPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="surface-panel rounded-[24px] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Savings Goals</h3>
        </div>

        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/70 p-5">
            <p className="font-medium text-foreground">No goals created yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create goals in Savings, then assign new receive transfers so each saved amount has a clear destination.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.slice(0, 4).map((goal) => {
              const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)

              return (
                <div key={goal.id} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{goal.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatUSD(goal.currentAmount)} of {formatUSD(goal.targetAmount)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{percentage.toFixed(0)}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel rounded-[24px] p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Simulate a transfer to make the dashboard tell a story.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/75 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground capitalize">{transaction.type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                    {transaction.savingsGoalName ? (
                      <p className="mt-1 text-xs text-primary">Goal: {transaction.savingsGoalName}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatUSD(transaction.amount)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Saved {formatUSD(transaction.savingsAmount)}
                      {transaction.flexModeUsed ? ' via Flex Mode' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface-panel rounded-[24px] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Demo Proof Panel</h3>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-primary/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current state</p>
              <p className="mt-2 text-sm text-foreground">
                This build demonstrates product logic and user flow. It does not yet prove a live Monad transaction inside the UI.
              </p>
            </div>

            <div className="rounded-2xl bg-background/75 p-4">
              <p className="text-sm font-semibold text-foreground">Best current demo sequence</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Dashboard → Receive $100 → show split → activate Flex Mode → receive again → open Insights.
              </p>
            </div>

            {latestTransaction ? (
              <div className="rounded-2xl bg-background/75 p-4">
                <p className="text-sm font-semibold text-foreground">Latest processed transfer</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatUSD(latestTransaction.amount)} received at {formatDate(latestTransaction.createdAt)}.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Split into {formatNaira(latestTransaction.amountNaira)} spendable and {formatUSD(latestTransaction.savingsAmount)} saved.
                </p>
                {latestTransaction.savingsGoalName ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Assigned to {latestTransaction.savingsGoalName}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] bg-muted/45 p-6">
        <p className="mb-3 text-sm text-muted-foreground">Your Linked Wallet</p>
        {wallet.linkedWalletAddress ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {wallet.linkedWalletProvider || 'EVM'} Wallet Connected
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <code className="truncate text-xs text-foreground">{wallet.linkedWalletAddress}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(wallet.linkedWalletAddress as string)
                  toast.success('Linked wallet copied!')
                }}
                className="whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Copy
              </button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-br from-primary/10 via-accent/10 to-background p-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent/25 blur-2xl" />

            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-xs font-medium text-foreground">No linked wallet yet</span>
              </div>
              <p className="mb-4 text-sm text-foreground">
                Connect MetaMask, Trust Wallet, or Rabby in Settings to unlock wallet-native features.
              </p>
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
    </div>
  )
}
