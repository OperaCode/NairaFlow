'use client'

import { useEffect, useState } from 'react'
import { Lock, TrendingUp, AlertCircle, Loader2, Plus, X, Target } from 'lucide-react'
import { toast } from 'react-toastify'

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  createdAt: number
  updatedAt: number
}

interface SavingsTransaction {
  id: string
  type: string
  savingsAmount: number
  savingsGoalId?: string | null
  savingsGoalName?: string | null
  createdAt: number
}

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
  goals: Goal[]
  transactions: SavingsTransaction[]
}

export default function SavingsPage() {
  const [data, setData] = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingGoal, setIsCreatingGoal] = useState(false)
  const [creatingGoal, setCreatingGoal] = useState(false)
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')

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

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoalName || !newGoalTarget) return

    const targetAmount = Number(newGoalTarget)
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      toast.error('Please enter a valid target amount')
      return
    }

    setCreatingGoal(true)
    try {
      const response = await fetch('/api/savings/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGoalName,
          targetAmount,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create goal')
      }

      setData((current) =>
        current
          ? {
              ...current,
              goals: [result.goal, ...current.goals],
            }
          : current
      )
      setIsCreatingGoal(false)
      setNewGoalName('')
      setNewGoalTarget('')
      toast.success('Goal created successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create goal'
      toast.error(message)
    } finally {
      setCreatingGoal(false)
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
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Savings Vault</h1>
        <p className="text-muted-foreground">
          Your protected stablecoins secured against inflation
        </p>
      </div>

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

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Security by Default</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Your savings are locked in time-based withdrawal periods. This protects against impulsive spending and market volatility.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Savings Goals
          </h3>
          <button
            onClick={() => setIsCreatingGoal(true)}
            className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>

        {data.goals.length > 0 ? (
          <div className="space-y-4">
            {data.goals.map((goal) => {
              const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              const isCompleted = percentage >= 100

              return (
                <div key={goal.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{goal.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatUSD(goal.currentAmount)} / {formatUSD(goal.targetAmount)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent relative overflow-hidden transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    >
                      {!isCompleted ? (
                        <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 animate-pulse" />
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No savings goals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a goal here, then assign new receive transfers to it from the receive page.
            </p>
          </div>
        )}

        {isCreatingGoal ? (
          <form onSubmit={handleCreateGoal} className="mt-4 p-4 border border-border rounded-lg bg-background">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground text-sm">Create New Goal</h4>
              <button
                type="button"
                onClick={() => setIsCreatingGoal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Goal Name (e.g., Vacation)"
                  required
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Target Amount ($)"
                  min="1"
                  step="any"
                  required
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="submit"
                disabled={creatingGoal}
                className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {creatingGoal ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingGoal(true)}
            className="w-full mt-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition font-semibold"
          >
            + Create New Goal
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Withdraw Savings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Convert your stablecoins back to Naira. Your next withdrawal is available now.
        </p>
        <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
          Withdraw to Naira
        </button>
      </div>

      {data.transactions.length > 0 ? (
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
                  {tx.savingsGoalName ? (
                    <p className="mt-1 text-xs text-primary">Goal: {tx.savingsGoalName}</p>
                  ) : null}
                </div>
                <p className={`font-semibold ${tx.savingsAmount >= 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {tx.savingsAmount >= 0 ? '+' : ''}
                  {formatUSD(tx.savingsAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
