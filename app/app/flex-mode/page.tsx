'use client'

import { useState, useEffect } from 'react'
import { Zap, AlertCircle, Check, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

interface FlexModeStatus {
  flexModeActive: boolean
  flexModeCooldownUntil: number | null
  flexModeAvailable: boolean
}

export default function FlexModePage() {
  const [status, setStatus] = useState<FlexModeStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setStatus({
          flexModeActive: data.wallet.flexModeActive,
          flexModeCooldownUntil: data.wallet.flexModeCooldownUntil,
          flexModeAvailable: Boolean(data.wallet.flexModeAvailable),
        })
      }
    } catch (error) {
      console.error('Failed to fetch status')
    }
  }

  const handleActivate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/flex-mode/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Flex Mode activated!')
        fetchStatus()
      } else {
        toast.error(data.error || 'Failed to activate flex mode')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/flex-mode/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Flex Mode deactivated!')
        fetchStatus()
      } else {
        toast.error(data.error || 'Failed to deactivate flex mode')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isActive = Boolean(status?.flexModeActive)
  const isCoolingDown =
    Boolean(status?.flexModeCooldownUntil) &&
    Number(status?.flexModeCooldownUntil) > Date.now()
  const cooldownLabel = status?.flexModeCooldownUntil
    ? new Date(status.flexModeCooldownUntil).toLocaleString('en-NG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Flex Mode</h1>
        <p className="text-muted-foreground">
          A deliberate exception to auto-save when the user needs maximum short-term liquidity.
        </p>
      </div>

      {/* Main Status Card */}
      <div className={`rounded-xl p-8 border-2 ${
        isActive
                ? 'bg-primary/10 border-primary'
                : 'bg-card border-border'
      }`}>
        <div className="flex items-start gap-4">
          <Zap className={`w-8 h-8 flex-shrink:0 ${
            isActive
              ? 'text-primary'
              : 'text-muted-foreground'
          }`} />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isActive
                ? 'Ready to Use'
                : isCoolingDown
                  ? 'Cooling Down'
                : 'Not Active'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isActive
                ? 'Flex Mode is armed for your next inbound deposit only. After one use, normal auto-save resumes and cooldown begins.'
                : isCoolingDown
                  ? `Flex Mode has been used. It becomes available again on ${cooldownLabel}.`
                  : 'Flex Mode is OFF. Normal auto-save rules apply.'}
            </p>

            <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm text-foreground">
              Business rule: Flex Mode is a one-time exception, not a standing mode.
            </div>

            {!isActive && (
              <button
                onClick={handleActivate}
                disabled={loading || isCoolingDown}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Activate For Next Deposit
                  </>
                )}
              </button>
            )}

            {isActive && (
              <button
                onClick={handleDeactivate}
                disabled={loading}
                className="px-6 py-2 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-muted transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Cancel Flex Mode
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">How Flex Mode Works</h3>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink:0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Activate</h4>
              <p className="text-sm text-muted-foreground">Click "Activate Flex Mode" to turn it ON.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink:0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Next Deposit Uses It</h4>
              <p className="text-sm text-muted-foreground">Your next inbound deposit skips savings once and credits 100% as spendable value.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink:0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Cooldown Starts Automatically</h4>
              <p className="text-sm text-muted-foreground">After that one deposit, Flex Mode turns off and a 7-day cooldown is applied.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink:0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">4</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Back to Auto-Save</h4>
              <p className="text-sm text-muted-foreground">All later deposits go back to your configured savings percentage until Flex Mode is available again.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Card */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink:0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Use Wisely</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Flex Mode bypasses your automatic savings protection. It is useful as a product mechanic because it makes the default auto-save feel humane rather than rigid.
          </p>
        </div>
      </div>

      {/* Rules Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Rules</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-secondary flex-shrink:0 mt-0.5" />
            <p className="text-sm text-foreground">Can be armed only if no cooldown is active</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-secondary flex-shrink:0 mt-0.5" />
            <p className="text-sm text-foreground">Applies to the next inbound deposit only</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-secondary flex-shrink:0 mt-0.5" />
            <p className="text-sm text-foreground">You can cancel it before use from this page</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-secondary flex-shrink:0 mt-0.5" />
            <p className="text-sm text-foreground">After use, a 7-day cooldown blocks reactivation</p>
          </div>
        </div>
      </div>

      {/* Example Scenario */}
      <div className="bg-muted/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Example Scenario</h3>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-2">Monday: Receive $100</p>
            <p className="text-muted-foreground">
              → $90 converted to Naira (spendable), $10 saved in USDC (normal 10% savings)
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-2">Monday: Activate Flex Mode</p>
            <p className="text-muted-foreground">
              → Status changes to "Ready to Use"
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-2">Tuesday: Receive $100 again</p>
            <p className="text-muted-foreground">
              → $100 converted to Naira (spendable), $0 saved, cooldown begins automatically
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-2">Next Week: Reactivate</p>
            <p className="text-muted-foreground">
              → Once cooldown expires, you can arm Flex Mode again for another single exception.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
