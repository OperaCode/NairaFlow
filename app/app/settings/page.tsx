'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Copy, LogOut, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

const MONAD_TESTNET_CHAIN_ID_HEX = '0x279f'
const MONAD_TESTNET_LABEL = 'Monad Testnet'
const MONAD_TESTNET_RPC_URL = 'https://testnet-rpc.monad.xyz'

interface UserSettings {
  id: string
  email: string
  walletAddress: string
  linkedWalletAddress: string | null
  linkedWalletProvider: string | null
  savingsPercentage: number
  vaultEnabled: boolean
  vaultAddress: string | null
}

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
]

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000'
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [savingsPercentage, setSavingsPercentage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [walletLinkLoading, setWalletLinkLoading] = useState(false)
  const [vaultLoading, setVaultLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          id: data.wallet.id,
          email: data.wallet.email,
          walletAddress: data.wallet.walletAddress,
          linkedWalletAddress: data.wallet.linkedWalletAddress || null,
          linkedWalletProvider: data.wallet.linkedWalletProvider || null,
          savingsPercentage: data.wallet.savingsPercentage,
          vaultEnabled: data.wallet.vaultEnabled || false,
          vaultAddress: data.wallet.vaultAddress || null,
        })
        setSavingsPercentage(data.wallet.savingsPercentage)
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleEnableVault = async () => {
    if (!settings?.linkedWalletAddress) {
      toast.error('Please connect your external wallet first')
      return
    }

    setVaultLoading(true)
    try {
      const provider = getInjectedProvider()
      if (!provider) throw new Error('No provider found')

      const { ethers } = await import('ethers')
      const ethersProvider = new ethers.BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()
      
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer)
      
      toast.info('Requesting USDC approval for the Monad Vault...')
      const tx = await usdcContract.approve(VAULT_ADDRESS, ethers.MaxUint256)
      
      toast.info('Confirming approval on Monad Testnet...')
      await tx.wait()

      // Update backend
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultEnabled: true, vaultAddress: VAULT_ADDRESS }),
      })

      if (response.ok) {
        setSettings({ ...settings, vaultEnabled: true, vaultAddress: VAULT_ADDRESS })
        toast.success('On-Chain Vault enabled and protected! 🛡️')
      } else {
        throw new Error('Failed to update vault status in profile')
      }
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to enable vault')
    } finally {
      setVaultLoading(false)
    }
  }

  type Eip1193Provider = {
    request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
    isMetaMask?: boolean
    isTrust?: boolean
    isRabby?: boolean
  }

  async function ensureMonadTestnet(provider: Eip1193Provider) {
    const currentChainId = await provider.request({ method: 'eth_chainId' })
    if (currentChainId === MONAD_TESTNET_CHAIN_ID_HEX) {
      return
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET_CHAIN_ID_HEX }],
      })
      toast.success(`Switched wallet to ${MONAD_TESTNET_LABEL}`)
    } catch (error) {
      const switchError = error as { code?: number; message?: string }
      if (switchError?.code !== 4902) {
        throw error
      }

      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: MONAD_TESTNET_CHAIN_ID_HEX,
            chainName: MONAD_TESTNET_LABEL,
            nativeCurrency: {
              name: 'MON',
              symbol: 'MON',
              decimals: 18,
            },
            rpcUrls: [MONAD_TESTNET_RPC_URL],
          },
        ],
      })

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET_CHAIN_ID_HEX }],
      })
      toast.success(`${MONAD_TESTNET_LABEL} added to wallet`)
    }
  }

  const getInjectedProvider = (): Eip1193Provider | null => {
    if (typeof window === 'undefined') return null
    const eth = (window as Window & { ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] } }).ethereum
    if (!eth) return null

    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
      return eth.providers.find((p) => p.isMetaMask) || eth.providers[0]
    }

    return eth
  }

  const detectProviderName = (provider: Eip1193Provider) => {
    if (provider.isRabby) return 'Rabby'
    if (provider.isTrust) return 'Trust Wallet'
    if (provider.isMetaMask) return 'MetaMask'
    return 'EVM Wallet'
  }

  const connectWalletAddress = async () => {
    const provider = getInjectedProvider()
    if (!provider) {
      toast.error('No wallet found. Install MetaMask or another EVM wallet extension.')
      return null
    }

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[]
      await ensureMonadTestnet(provider)
      const address = accounts?.[0]
      if (!address) {
        toast.error('No wallet account returned')
        return null
      }
      return { address, providerName: detectProviderName(provider) }
    } catch (error) {
      toast.error('Wallet connection or Monad network switch failed')
      return null
    }
  }

  const handleLinkWallet = async () => {
    setWalletLinkLoading(true)
    try {
      const connected = await connectWalletAddress()
      if (!connected) return

      const response = await fetch('/api/user/wallet-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: connected.address,
          providerName: connected.providerName,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to link wallet')
        return
      }

      if (settings) {
        setSettings({
          ...settings,
          linkedWalletAddress: data.linkedWalletAddress || connected.address,
          linkedWalletProvider: data.linkedWalletProvider || connected.providerName,
        })
      }
      toast.success(data.message || 'External wallet linked')
    } catch (error) {
      toast.error('Failed to link wallet')
    } finally {
      setWalletLinkLoading(false)
    }
  }

  const handleUnlinkWallet = async () => {
    setWalletLinkLoading(true)
    try {
      const response = await fetch('/api/user/wallet-link', {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to unlink wallet')
        return
      }

      if (settings) {
        setSettings({
          ...settings,
          linkedWalletAddress: null,
          linkedWalletProvider: null,
        })
      }
      toast.success(data.message || 'External wallet unlinked')
    } catch (error) {
      toast.error('Failed to unlink wallet')
    } finally {
      setWalletLinkLoading(false)
    }
  }

  const handleSaveSavingsPercentage = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savingsPercentage }),
      })

      if (response.ok) {
        toast.success(`Savings rate updated to ${savingsPercentage}%`)
        if (settings) {
          setSettings({ ...settings, savingsPercentage })
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and customize your NairaFlow experience
        </p>
      </div>

      {/* Savings Percentage */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Auto-Save Rate</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Percentage of every incoming transfer automatically moved to your protected savings vault
        </p>

        <div className="space-y-4">
          {/* Slider */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="savings-slider" className="text-sm font-medium text-foreground">
                Set your savings rate
              </label>
              <span className="text-2xl font-bold text-secondary">{savingsPercentage}%</span>
            </div>

            <input
              id="savings-slider"
              type="range"
              min="10"
              max="100"
              value={savingsPercentage}
              onChange={(e) => setSavingsPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-secondary"
            />

            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Min: 10%</span>
              <span>Max: 100%</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => setSavingsPercentage(percentage)}
                className={`py-2 rounded-lg transition font-semibold text-sm ${
                  savingsPercentage === percentage
                    ? 'bg-secondary text-secondary-foreground'
                    : 'border border-border text-foreground hover:bg-muted'
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-4 mt-6">
            <p className="text-xs text-muted-foreground mb-2">Example: Receiving $100</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Spendable (Naira)</span>
                <span className="font-semibold text-foreground">₦{(100 - savingsPercentage) * 1200}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Protected Savings</span>
                <span className="font-semibold text-secondary">${(savingsPercentage).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSavingsPercentage}
            disabled={saving || savingsPercentage === settings?.savingsPercentage}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>

          <div className="pt-6 border-t border-border mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Monad On-Chain Vault</h4>
                <p className="text-xs text-muted-foreground">Automate your savings directly into a locked contract</p>
              </div>
              {settings?.vaultEnabled ? (
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  Active 🛡️
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                  Inactive
                </span>
              )}
            </div>
            
            {!settings?.vaultEnabled ? (
              <button
                onClick={handleEnableVault}
                disabled={vaultLoading}
                className="w-full py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/5 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {vaultLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enabling Vault...
                  </>
                ) : (
                  'Enable On-Chain Vault'
                )}
              </button>
            ) : (
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Vault Address (Monad Testnet)</p>
                <p className="text-xs font-mono text-foreground truncate">{settings.vaultAddress}</p>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              Enabling the vault requires a one-time approval transaction to allow NairaFlow to automate your savings portion into the Piggy Bank contract.
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Wallet Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Wallet Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings?.walletAddress || ''}
                readOnly
                className="flex-1 px-4 py-3 bg-muted/50 rounded-lg border border-input text-foreground font-mono text-sm"
              />
              <button
                onClick={() => {
                  if (settings?.walletAddress) {
                    navigator.clipboard.writeText(settings.walletAddress)
                    toast.success('Copied!')
                  }
                }}
                className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is your permanent blockchain wallet address on EVM-compatible networks
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Email
            </label>
            <div className="px-4 py-3 bg-muted/50 rounded-lg border border-input text-foreground">
              {settings?.email || 'Unavailable'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Network
            </label>
            <div className="px-4 py-3 bg-muted/50 rounded-lg border border-input text-foreground">
              Monad EVM Testnet
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Currently configured for Monad testnet. Mainnet support coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* External Wallet */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">External Wallet (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Link a personal wallet address for future on-chain deposit tracking. Your NairaFlow wallet remains primary.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border border-input bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Linked Wallet Address</p>
            <p className="font-mono text-sm text-foreground break-all">
              {settings?.linkedWalletAddress || 'Not connected'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLinkWallet}
              disabled={walletLinkLoading || !!settings?.linkedWalletAddress}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {walletLinkLoading ? 'Connecting...' : settings?.linkedWalletAddress ? 'Wallet Connected' : 'Connect Wallet'}
            </button>

            <button
              onClick={handleUnlinkWallet}
              disabled={walletLinkLoading || !settings?.linkedWalletAddress}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              Unlink Wallet
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Connect uses your browser wallet provider and will prompt a switch to Monad Testnet before linking. Signature verification will be added in a later step.
          </p>

          {settings?.linkedWalletProvider ? (
            <p className="text-xs text-foreground">
              Connected via <span className="font-semibold">{settings.linkedWalletProvider}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Security */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Implementation Status</h3>

        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Implemented in this demo
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              Session cookies, wallet generation, auto-save logic, Flex Mode, and transaction history simulation are working.
            </p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Not yet implemented
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Live Monad transaction verification, production-grade custody, and strong account security still need to be wired in.
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Recommended before demo day
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Deploy contract to Monad testnet, expose one contract address, and show one tx hash or event in the receive flow.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Notifications</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Transfer Received</p>
              <p className="text-xs text-muted-foreground">Get notified when funds arrive</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 accent-primary rounded"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Savings Milestone</p>
              <p className="text-xs text-muted-foreground">Celebrate your savings goals</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 accent-primary rounded"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Weekly Insights</p>
              <p className="text-xs text-muted-foreground">Get your savings summary</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 accent-primary rounded"
            />
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Account</h3>

        <div className="space-y-3">
          <button className="w-full py-3 rounded-lg border border-border text-foreground hover:bg-muted transition font-semibold">
            Change Password
          </button>
          <button className="w-full py-3 rounded-lg border border-border text-foreground hover:bg-muted transition font-semibold">
            Download Data
          </button>
          <button className="w-full py-3 rounded-lg border border-destructive text-destructive hover:bg-destructive/5 transition font-semibold flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Support */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Need Help?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Have questions about NairaFlow? We&apos;re here to help.
        </p>
        <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
          Contact Support
        </button>
      </div>
    </div>
  )
}
