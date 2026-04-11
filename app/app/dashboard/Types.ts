export interface Wallet {
  id: string
  email?: string
  walletAddress: string
  linkedWalletAddress: string | null
  linkedWalletProvider: string | null
  nairaBalance: string
  usdBalance: string
  savingsBalance: string
  savingsPercentage: number
  flexModeActive: boolean
  flexModeCooldownUntil: number | null
  flexModeAvailable?: boolean
}

export interface OnchainConfig {
  defaultNetwork: string
  networkType: string
  primaryAsset: 'USDC' | 'USDT'
  supportedStablecoins: Array<'USDC' | 'USDT'>
}

export interface Transaction {
  id: string
  type: string
  amount: number
  amountNaira: number
  savingsAmount: number
  savingsPercentage: number
  flexModeUsed: boolean
  status: string
  createdAt: number
}
