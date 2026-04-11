import { getDb } from './mongodb'

// Database Models for NairaFlow

export interface User {
  id: string
  email: string
  passwordHash: string
  walletAddress: string
  linkedWalletAddress: string | null
  linkedWalletProvider: string | null
  lastOnchainSyncBlock: number | null
  fiatProvider: 'paystack' | 'mock'
  fiatAccountNumber: string | null
  fiatAccountName: string | null
  fiatBankName: string | null
  fiatCustomerCode: string | null
  fiatDedicatedAccountId: number | null
  fiatProviderSlug: string | null
  nairaBalance: number // Converted value
  usdBalance: number // USDC balance
  savingsBalance: number // USDC savings vault
  savingsPercentage: number // Default 10%
  vaultEnabled: boolean
  vaultAddress: string | null
  flexModeActive: boolean
  flexModeCooldownUntil: number | null // Timestamp
  createdAt: number
  updatedAt: number
}

export interface Transaction {
  id: string
  userId: string
  type: 'receive' | 'receive_fiat' | 'withdraw' | 'convert'
  channel: 'simulated' | 'fiat' | 'onchain'
  sourceRef: string | null
  savingsGoalId?: string | null
  savingsGoalName?: string | null
  amount: number // Amount in USD
  amountNaira: number // Converted Naira amount
  savingsAmount: number // Amount saved in USD
  savingsPercentage: number // % applied
  flexModeUsed: boolean
  exchangeRate: number // USD to NGN rate used
  fxProvider?: string
  fxQuoteTimestamp?: number
  fxQuoteStale?: boolean
  status: 'pending' | 'completed' | 'failed'
  createdAt: number
}

export interface DepositSettlement {
  spendableNaira: number
  savingsUSD: number
  exchangeRate: number
  savingsPercentage: number
  flexModeUsed: boolean
  fxProvider: string
  fxQuoteTimestamp: number
  fxQuoteStale: boolean
}

export interface Deposit {
  id: string
  userId: string
  rail: 'simulated' | 'fiat' | 'onchain'
  reference: string
  sourceRef: string | null
  savingsGoalId?: string | null
  savingsGoalName?: string | null
  currency: 'USD' | 'NGN'
  amount: number
  amountUsd: number
  status: 'pending' | 'confirmed' | 'credited' | 'failed'
  metadata: Record<string, unknown> | null
  settlement: DepositSettlement | null
  createdAt: number
  updatedAt: number
  settledAt: number | null
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string // e.g., "Rent", "Emergency"
  targetAmount: number
  currentAmount: number
  deadline?: number // Timestamp
  createdAt: number
  updatedAt: number
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: number
}

let indexesReadyPromise: Promise<void> | undefined

async function ensureIndexes() {
  if (!indexesReadyPromise) {
    indexesReadyPromise = (async () => {
      const db = await getDb()
      await Promise.all([
        db.collection<User>('users').createIndexes([
          { key: { id: 1 }, name: 'users_id_unique', unique: true },
          { key: { email: 1 }, name: 'users_email_unique', unique: true },
          {
            key: { fiatCustomerCode: 1 },
            name: 'users_fiat_customer_code_unique',
            unique: true,
            sparse: true,
          },
        ]),
        db.collection<Session>('sessions').createIndexes([
          { key: { id: 1 }, name: 'sessions_id_unique', unique: true },
          { key: { token: 1 }, name: 'sessions_token_unique', unique: true },
          { key: { userId: 1 }, name: 'sessions_userId_idx' },
        ]),
        db.collection<Transaction>('transactions').createIndexes([
          { key: { userId: 1, createdAt: -1 }, name: 'transactions_user_created_idx' },
          { key: { id: 1 }, name: 'transactions_id_unique', unique: true },
          {
            key: { userId: 1, sourceRef: 1 },
            name: 'transactions_user_source_unique',
            unique: true,
            sparse: true,
          },
        ]),
        db.collection<Deposit>('deposits').createIndexes([
          { key: { id: 1 }, name: 'deposits_id_unique', unique: true },
          { key: { userId: 1, reference: 1 }, name: 'deposits_user_reference_unique', unique: true },
          { key: { userId: 1, createdAt: -1 }, name: 'deposits_user_created_idx' },
          { key: { sourceRef: 1 }, name: 'deposits_source_ref_idx', sparse: true },
        ]),
        db.collection<SavingsGoal>('savings_goals').createIndexes([
          { key: { id: 1 }, name: 'savings_goals_id_unique', unique: true },
          { key: { userId: 1, createdAt: -1 }, name: 'savings_goals_user_created_idx' },
        ]),
      ])
    })()
  }

  await indexesReadyPromise
}

export async function getUsersCollection() {
  const db = await getDb()
  await ensureIndexes()
  return db.collection<User>('users')
}

export async function getTransactionsCollection() {
  const db = await getDb()
  await ensureIndexes()
  return db.collection<Transaction>('transactions')
}

export async function getDepositsCollection() {
  const db = await getDb()
  await ensureIndexes()
  return db.collection<Deposit>('deposits')
}

export async function getSavingsGoalsCollection() {
  const db = await getDb()
  await ensureIndexes()
  return db.collection<SavingsGoal>('savings_goals')
}

export async function getSessionsCollection() {
  const db = await getDb()
  await ensureIndexes()
  return db.collection<Session>('sessions')
}

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function generateWalletAddress(): string {
  const chars = '0123456789abcdef'
  let address = '0x'
  for (let i = 0; i < 40; i++) {
    address += chars.charAt(Math.floor(Math.random() * 16))
  }
  return address
}
