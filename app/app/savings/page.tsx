'use client'

import { useState, useEffect } from 'react'
import { Lock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

interface SavingsData {
  savings: {
    balance: string
    percentage: number
  }
  stats: {
    totalReceived: number
    totalSaved: number
    averageSavingsPercentage: number
    transactionCount: number
  }
  transactions: any[]
}

export default function SavingsPage() {
  const [data, setData] = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSavings()
  }, [])

  const fetchSavings = async () => {
    try {
      const response = await fetch('/api/savings')
      if (!response.ok) throw new Error('Failed to fetch savings')

      const result = await response.json()
      setData(result)
    } catch (error) {
      toast.error('Failed to load savings')
    } finally {
      setLoading(false)
    }
  }

  const formatUSD = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `$${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading savings...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
        <p className="text-foreground font-semibold">Unable to load savings data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Savings Vault</h1>
        <p className="text-muted-foreground">
          Your protected stablecoins secured against inflation
        </p>
      </div>

      {/* Main Savings Card */}
      <div className="bg-linear-to-br from-secondary to-accent rounded-xl p-8 text-secondary-foreground">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-secondary-foreground/70 mb-1">Total Savings</p>
            <h2 className="text-4xl font-bold">{formatUSD(data.savings.balance)}</h2>
          </div>
          <Lock className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-sm opacity-70">
          Protected in USDC/USDT stablecoins on blockchain
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Total Received</p>
          <p className="text-2xl font-bold text-foreground">${data.stats.totalReceived.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Transactions</p>
          <p className="text-2xl font-bold text-foreground">{data.stats.transactionCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Avg Savings %</p>
          <p className="text-2xl font-bold text-foreground">
            {data.stats.averageSavingsPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Time Lock Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Security by Default</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Your savings are locked in time-based withdrawal periods. This protects against impulsive spending and market volatility.
          </p>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Savings Goals
        </h3>

        <div className="space-y-4">
          {/* Emergency Fund Goal */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">Emergency Fund</h4>
                <p className="text-xs text-muted-foreground">${data.savings.balance} / $5,000</p>
              </div>
              <span className="text-sm font-semibold text-primary">
                {(parseFloat(data.savings.balance) / 5000 * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.min(parseFloat(data.savings.balance) / 5000 * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Rent Fund Goal */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">Rent Reserve</h4>
                <p className="text-xs text-muted-foreground">$0 / $10,000</p>
              </div>
              <span className="text-sm font-semibold text-primary">0%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: '0%' }} />
            </div>
          </div>
        </div>

        <button className="w-full mt-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition font-semibold">
          + Create New Goal
        </button>
      </div>

      {/* Withdrawal Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Withdraw Savings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Convert your stablecoins back to Naira. Your next withdrawal is available now.
        </p>
        <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
          Withdraw to Naira
        </button>
      </div>

      {/* Recent Transactions */}
      {data.transactions && data.transactions.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Savings History</h3>
          <div className="space-y-3">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground capitalize">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className={`font-semibold ${tx.savingsAmount >= 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {tx.savingsAmount >= 0 ? '+' : ''}{formatUSD(tx.savingsAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
