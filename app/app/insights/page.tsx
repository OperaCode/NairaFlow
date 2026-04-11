'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Loader2, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'react-toastify'

interface InsightTransaction {
  id: string
  amount: number
  amountNaira: number
  savingsAmount: number
  savingsPercentage: number
  flexModeUsed: boolean
  createdAt: number
}

interface InsightsData {
  stats: {
    totalReceived: number
    totalSaved: number
    averageSavingsPercentage: number
    transactionCount: number
  }
  transactions: InsightTransaction[]
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/savings')
      if (!response.ok) throw new Error('Failed to fetch insights')

      const result = await response.json()
      setData(result)
    } catch (error) {
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const formatUSD = (amount: number) =>
    `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const chartTransactions = [...(data?.transactions ?? [])]
    .filter((transaction) => transaction.savingsAmount >= 0)
    .sort((a, b) => a.createdAt - b.createdAt)

  let runningSavings = 0
  let runningReceived = 0

  const savingsGrowthData = chartTransactions.map((transaction, index) => {
    runningSavings += transaction.savingsAmount
    runningReceived += transaction.amount

    return {
      step: `T${index + 1}`,
      saved: Number(runningSavings.toFixed(2)),
      received: Number(runningReceived.toFixed(2)),
      savingsRate: transaction.savingsPercentage,
    }
  })

  const latestSplitData = chartTransactions.slice(-5).map((transaction, index) => ({
    name: `Tx ${chartTransactions.length - chartTransactions.slice(-5).length + index + 1}`,
    spendable: Number((transaction.amount - transaction.savingsAmount).toFixed(2)),
    saved: Number(transaction.savingsAmount.toFixed(2)),
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="font-semibold text-foreground">Unable to load insights data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Insights & Analytics</h1>
        <p className="text-muted-foreground">
          These charts now reflect actual simulated transfers instead of placeholder values.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="surface-panel rounded-[24px] p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Total Received</p>
          <p className="text-2xl font-semibold text-foreground">{formatUSD(data.stats.totalReceived)}</p>
        </div>
        <div className="surface-panel rounded-[24px] p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Total Saved</p>
          <p className="text-2xl font-semibold text-secondary">{formatUSD(data.stats.totalSaved)}</p>
        </div>
        <div className="surface-panel rounded-[24px] p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Transactions</p>
          <p className="text-2xl font-semibold text-foreground">{data.stats.transactionCount}</p>
        </div>
        <div className="surface-panel rounded-[24px] p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Avg Savings %</p>
          <p className="text-2xl font-semibold text-foreground">
            {data.stats.averageSavingsPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {savingsGrowthData.length > 0 ? (
        <div className="surface-panel rounded-[24px] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5" />
            Savings Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={savingsGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9ddd6" />
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip formatter={(value) => formatUSD(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="saved"
                stroke="#4f5bd5"
                strokeWidth={3}
                name="Cumulative Saved"
                dot={{ fill: '#4f5bd5' }}
              />
              <Line
                type="monotone"
                dataKey="received"
                stroke="#2fa89a"
                strokeWidth={2}
                name="Cumulative Received"
                dot={{ fill: '#2fa89a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div className="surface-panel rounded-[24px] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <BarChart3 className="h-5 w-5" />
          Latest Split Breakdown
        </h3>

        {latestSplitData.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={latestSplitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9ddd6" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatUSD(Number(value))} />
                <Legend />
                <Bar dataKey="spendable" fill="#4f5bd5" name="Spendable USD Equivalent" />
                <Bar dataKey="saved" fill="#2fa89a" name="Saved USD" />
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary/10 p-4">
                <p className="text-sm font-semibold text-foreground">What the charts prove</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every receive transaction contributes to cumulative saved value unless Flex Mode is used.
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm font-semibold text-foreground">Current limitation</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The data is honest, but it still comes from app-side simulation rather than a live Monad event indexer.
                </p>
              </div>

              <div className="rounded-2xl bg-primary/10 p-4">
                <p className="text-sm font-semibold text-primary">Pitch line</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  “This is the behavior layer. The next milestone is making this exact history verifiable on Monad testnet.”
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No transfer data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Run a few transfers first so the charts have something real to display.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
