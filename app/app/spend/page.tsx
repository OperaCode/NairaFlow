'use client'

import Link from 'next/link'
import { ArrowRight, Landmark, QrCode, Wallet } from 'lucide-react'

export default function SpendPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Spend</h1>
        <p className="text-muted-foreground">
          Choose how you want to use your spendable naira balance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface-panel rounded-2xl p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Landmark className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Bank Transfer</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Send spendable balance to a bank account (placeholder flow for now).
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-70"
            disabled
          >
            Coming Soon
          </button>
        </div>

        <div className="surface-panel rounded-2xl p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <QrCode className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Merchant QR</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Scan merchant QR and pay from your spendable pool (placeholder flow for now).
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground opacity-70"
            disabled
          >
            Coming Soon
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Current state</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Spend flow UI is ready. Settlement rails and live integrations are the next step.
        </p>
        <Link
          href="/app/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Back to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

