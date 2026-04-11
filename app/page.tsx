'use client'

import Link from 'next/link'
import { ArrowRight, Lock, Orbit, TrendingUp, Wallet, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent hero-glow">
            <span className="text-xl font-bold text-primary-foreground">₦</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">NairaFlow</h1>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Stablecoin savings on Monad</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-foreground hover:text-primary transition"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm text-muted-foreground surface-panel">
              <Orbit className="h-4 w-4 text-primary" />
              Consumer remittance UX with built-in savings discipline
            </div>
            <h2 className="mb-6 text-5xl font-semibold leading-[0.95] tracking-tight text-foreground md:text-7xl">
              Spend in naira.
              <br />
              <span className="text-primary">Store conviction in dollars.</span>
            </h2>
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              NairaFlow receives stablecoins, routes spending power instantly, and protects a portion in USD before lifestyle inflation can erase it.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Create Account <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
                href="/auth/login"
                className="rounded-2xl border border-border px-8 py-3 font-semibold text-foreground transition hover:bg-muted"
          >
                Open Demo
          </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="surface-panel rounded-3xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Split</p>
                <p className="mt-3 text-2xl font-semibold">$100</p>
                <p className="text-sm text-muted-foreground">becomes spend + reserve automatically</p>
              </div>
              <div className="surface-panel rounded-3xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Flex</p>
                <p className="mt-3 text-2xl font-semibold">1 tap</p>
                <p className="text-sm text-muted-foreground">to skip savings in emergencies</p>
              </div>
              <div className="surface-panel rounded-3xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Network</p>
                <p className="mt-3 text-2xl font-semibold">Monad</p>
                <p className="text-sm text-muted-foreground">positioned for high-throughput payments</p>
              </div>
            </div>
          </div>

          <div className="hero-glow surface-panel luxury-grid rounded-[32px] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live split preview</p>
                <h3 className="mt-2 text-2xl font-semibold">Incoming transfer: $100</h3>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                Protected
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl bg-background/85 p-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spendable balance</span>
                  <span className="font-semibold text-foreground">₦108,000</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[90%] rounded-full bg-linear-to-r from-primary to-secondary" />
                </div>
              </div>

              <div className="rounded-3xl bg-background/85 p-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Protected USD vault</span>
                  <span className="font-semibold text-foreground">$10.00</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[10%] rounded-full bg-accent" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-primary p-5 text-primary-foreground">
                  <Wallet className="mb-3 h-5 w-5" />
                  <p className="text-sm opacity-80">Auto-save rate</p>
                  <p className="mt-2 text-3xl font-semibold">10%</p>
                </div>
                <div className="rounded-3xl bg-card p-5">
                  <Zap className="mb-3 h-5 w-5 text-secondary" />
                  <p className="text-sm text-muted-foreground">Flex mode</p>
                  <p className="mt-2 text-3xl font-semibold">Ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4">
            <div className="surface-panel rounded-[28px] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Automatic Protection</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every transfer is automatically split between spendable cash and protected savings.
              </p>
            </div>
          </div>
          <div className="surface-panel rounded-[28px] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            <h3 className="mt-4 font-semibold text-foreground">Inflation Defense</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Keep your savings in stablecoins (USDC/USDT) to protect against currency volatility.
              </p>
            </div>
          <div className="surface-panel rounded-[28px] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            <h3 className="mt-4 font-semibold text-foreground">Emergency Flexibility</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Need extra cash? Use Flex Mode to skip savings on your next transfer.
              </p>
            </div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-y border-border/70 bg-muted/35 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-4xl font-semibold text-foreground">
            Built for African remittance behavior
          </h2>
          
          <div className="space-y-8">
            <div className="surface-panel rounded-[30px] p-8">
              <h3 className="mb-3 text-2xl font-semibold text-foreground">
                Smart Splitting
              </h3>
              <p className="text-muted-foreground">
                When you receive money, NairaFlow automatically splits it into spendable Naira 
                and protected savings in USDC. Default is 10% savings, but you control the percentage.
              </p>
            </div>

            <div className="surface-panel rounded-[30px] p-8">
              <h3 className="mb-3 text-2xl font-semibold text-foreground">
                Clear Conversion Story
              </h3>
              <p className="text-muted-foreground">
                Users immediately understand what they can spend in Naira and what remains protected in USD. That story is stronger than generic wallet UX.
              </p>
            </div>

            <div className="surface-panel rounded-[30px] p-8">
              <h3 className="mb-3 text-2xl font-semibold text-foreground">
                Monad-Ready Experience
              </h3>
              <p className="text-muted-foreground">
                The app is shaped around fast, low-friction consumer interactions, which is the right product surface for Monad. The next step is proving those flows onchain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="text-center">
            <div className="text-4xl font-semibold text-primary mb-2">10%</div>
            <p className="text-muted-foreground">minimum saved automatically by default</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-primary mb-2">7 days</div>
            <p className="text-muted-foreground">cooldown after using Flex Mode</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hero-glow mx-auto mb-20 max-w-5xl rounded-[36px] bg-primary px-6 py-20 text-primary-foreground">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-semibold">Turn remittance into disciplined wealth.</h2>
          <p className="text-lg mb-8 opacity-90">
            The concept is strong when the product feels premium and the onchain proof is visible.
          </p>
          <Link
            href="/auth/register"
            className="inline-block rounded-2xl bg-primary-foreground px-8 py-3 font-semibold text-primary transition hover:opacity-90"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent">
                <span className="text-lg font-bold text-primary-foreground">₦</span>
              </div>
              <span className="font-semibold text-foreground">NairaFlow</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 NairaFlow. Consumer remittance with automatic protection.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
