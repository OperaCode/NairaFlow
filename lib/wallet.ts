import { MongoServerError } from 'mongodb'
import {
  Deposit,
  generateId,
  getDepositsCollection,
  getTransactionsCollection,
  getUsersCollection,
} from './db/models'
import { getUsdNgnQuote, FxQuote } from './fx'
import { applySavingsToGoal, getSavingsGoalById } from './savings-goals'

const FLEX_MODE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export interface FiatReceiveResult {
  spendableNaira: number
  savingsUSD: number
  exchangeRate: number
  savingsPercentage: number
  fxProvider: string
  fxQuoteTimestamp: number
  fxQuoteStale: boolean
}

export interface SmartSplitResult extends FiatReceiveResult {
  flexModeUsed: boolean
  savingsGoalId: string | null
  savingsGoalName: string | null
}

export interface DepositProcessingResult {
  deposit: Deposit
  settlement: SmartSplitResult
  alreadyProcessed: boolean
}

export interface RecentDepositView {
  id: string
  rail: Deposit['rail']
  reference: string
  sourceRef: string | null
  currency: Deposit['currency']
  amount: number
  amountUsd: number
  status: Deposit['status']
  createdAt: number
  settledAt: number | null
  settlement: Deposit['settlement']
  metadata: Deposit['metadata']
}

interface ApplySplitOptions {
  channel: 'simulated' | 'fiat' | 'onchain'
  sourceRef?: string | null
  exchangeQuote?: FxQuote
  savingsGoalId?: string | null
}

interface DepositInput {
  userId: string
  rail: Deposit['rail']
  amount: number
  currency: Deposit['currency']
  reference: string
  sourceRef?: string | null
  metadata?: Record<string, unknown> | null
  savingsGoalId?: string | null
}

function isDuplicateKeyError(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000
}

function assertPositiveAmount(amount: number, fieldName: string) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${fieldName} must be greater than 0`)
  }
}

async function applySmartSplit(
  userId: string,
  amountUSD: number,
  options: ApplySplitOptions
): Promise<SmartSplitResult> {
  const users = await getUsersCollection()
  const transactions = await getTransactionsCollection()
  const userRecord = await users.findOne({ id: userId })

  if (!userRecord) throw new Error('User not found')

  const { _id, ...user } = userRecord
  const fxQuote = options.exchangeQuote || (await getUsdNgnQuote())
  const exchangeRate = fxQuote.rate
  let savingsPercentage = user.savingsPercentage
  let flexModeUsed = false
  let savingsGoalId: string | null = null
  let savingsGoalName: string | null = null

  if (options.savingsGoalId) {
    const goal = await getSavingsGoalById(userId, options.savingsGoalId)
    if (!goal) {
      throw new Error('Savings goal not found')
    }

    savingsGoalId = goal.id
    savingsGoalName = goal.name
  }

  if (user.flexModeActive) {
    savingsPercentage = 0
    flexModeUsed = true
    user.flexModeActive = false
    user.flexModeCooldownUntil = Date.now() + FLEX_MODE_COOLDOWN_MS
  }

  if (!flexModeUsed && savingsPercentage < 10) {
    savingsPercentage = 10
  }

  const savingsUSD = (amountUSD * savingsPercentage) / 100
  const spendableUSD = amountUSD - savingsUSD
  const spendableNaira = spendableUSD * exchangeRate

  user.nairaBalance += spendableNaira
  user.savingsBalance += savingsUSD
  user.updatedAt = Date.now()

  // On-Chain Vaulting logic for Monad Blitz is now handled fully natively by the Smart Contract
  // UI triggers SmartWallet.splitFunds directly, making this backend logic redundant for Web3.

  const transactionId = generateId()
  const transaction = {
    id: transactionId,
    userId,
    type: options.channel === 'fiat' ? ('receive_fiat' as const) : ('receive' as const),
    channel: options.channel,
    sourceRef: options.sourceRef || null,
    savingsGoalId,
    savingsGoalName,
    amount: amountUSD,
    amountNaira: spendableNaira,
    savingsAmount: savingsUSD,
    savingsPercentage,
    flexModeUsed,
    exchangeRate,
    fxProvider: fxQuote.provider,
    fxQuoteTimestamp: fxQuote.asOf,
    fxQuoteStale: fxQuote.stale,
    status: 'completed' as const,
    createdAt: Date.now(),
  }

  await transactions.insertOne(transaction)
  await users.updateOne({ id: userId }, { $set: user })
  if (savingsGoalId && savingsUSD > 0) {
    await applySavingsToGoal(userId, savingsGoalId, savingsUSD)
  }

  return {
    spendableNaira,
    savingsUSD,
    exchangeRate,
    savingsPercentage,
    flexModeUsed,
    savingsGoalId,
    savingsGoalName,
    fxProvider: fxQuote.provider,
    fxQuoteTimestamp: fxQuote.asOf,
    fxQuoteStale: fxQuote.stale,
  }
}

async function markDepositStatus(
  depositId: string,
  updates: Partial<Deposit>
): Promise<Deposit> {
  const deposits = await getDepositsCollection()
  await deposits.updateOne(
    { id: depositId },
    {
      $set: {
        ...updates,
        updatedAt: Date.now(),
      },
    }
  )

  const deposit = await deposits.findOne({ id: depositId })
  if (!deposit) throw new Error('Deposit not found after update')
  return deposit
}

function sanitizeReference(reference: string) {
  const trimmed = reference.trim()
  if (!trimmed) throw new Error('Deposit reference is required')
  return trimmed
}

export async function processInboundDeposit(input: DepositInput): Promise<DepositProcessingResult> {
  assertPositiveAmount(input.amount, 'Amount')

  const users = await getUsersCollection()
  const deposits = await getDepositsCollection()
  const user = await users.findOne({ id: input.userId })
  if (!user) throw new Error('User not found')

  const reference = sanitizeReference(input.reference)
  const existing = await deposits.findOne({ userId: input.userId, reference })
  if (existing && existing.status === 'credited' && existing.settlement) {
    return {
      deposit: existing,
      settlement: existing.settlement,
      alreadyProcessed: true,
    }
  }

  const initialQuote = await getUsdNgnQuote()
  const amountUsd = input.currency === 'USD' ? input.amount : input.amount / initialQuote.rate

  let deposit: Deposit =
    existing || {
      id: generateId(),
      userId: input.userId,
      rail: input.rail,
      reference,
      sourceRef: input.sourceRef || null,
      savingsGoalId: input.savingsGoalId || null,
      savingsGoalName: null,
      currency: input.currency,
      amount: input.amount,
      amountUsd,
      status: 'pending',
      metadata: input.metadata || null,
      settlement: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settledAt: null,
    }

  if (!existing) {
    try {
      await deposits.insertOne(deposit)
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error
      const duplicate = await deposits.findOne({ userId: input.userId, reference })
      if (!duplicate) throw error
      if (duplicate.status === 'credited' && duplicate.settlement) {
        return {
          deposit: duplicate,
          settlement: duplicate.settlement,
          alreadyProcessed: true,
        }
      }
      deposit = duplicate
    }
  }

  deposit = await markDepositStatus(deposit.id, {
    amountUsd,
    status: 'confirmed',
    sourceRef: input.sourceRef || deposit.sourceRef || null,
    metadata: input.metadata || deposit.metadata || null,
    savingsGoalId: input.savingsGoalId || deposit.savingsGoalId || null,
  })

  try {
    const settlement = await applySmartSplit(input.userId, amountUsd, {
      channel: input.rail === 'simulated' ? 'simulated' : input.rail,
      sourceRef: input.sourceRef || reference,
      exchangeQuote: initialQuote,
      savingsGoalId: input.savingsGoalId || deposit.savingsGoalId || null,
    })

    deposit = await markDepositStatus(deposit.id, {
      amountUsd,
      status: 'credited',
      settlement,
      settledAt: Date.now(),
      savingsGoalId: settlement.savingsGoalId,
      savingsGoalName: settlement.savingsGoalName,
    })

    return {
      deposit,
      settlement,
      alreadyProcessed: false,
    }
  } catch (error) {
    await markDepositStatus(deposit.id, {
      amountUsd,
      status: 'failed',
      metadata: {
        ...(deposit.metadata || {}),
        lastError: error instanceof Error ? error.message : 'Deposit settlement failed',
      },
    })
    throw error
  }
}

export async function smartSplit(
  userId: string,
  amountUSD: number,
  options?: {
    channel?: 'simulated' | 'onchain'
    sourceRef?: string | null
    metadata?: Record<string, unknown> | null
    savingsGoalId?: string | null
  }
): Promise<SmartSplitResult> {
  const result = await processInboundDeposit({
    userId,
    rail: options?.channel || 'simulated',
    amount: amountUSD,
    currency: 'USD',
    reference: options?.sourceRef || `simulated:${userId}:${amountUSD}:${Date.now()}`,
    sourceRef: options?.sourceRef || null,
    metadata: options?.metadata || null,
    savingsGoalId: options?.savingsGoalId || null,
  })

  return result.settlement
}

export async function withdrawSavings(userId: string, amount: number) {
  assertPositiveAmount(amount, 'Amount')

  const users = await getUsersCollection()
  const transactions = await getTransactionsCollection()
  const userRecord = await users.findOne({ id: userId })

  if (!userRecord) throw new Error('User not found')

  const { _id, ...user } = userRecord
  if (user.savingsBalance < amount) {
    throw new Error('Insufficient savings balance')
  }

  const fxQuote = await getUsdNgnQuote()
  const nairaAmount = amount * fxQuote.rate

  user.savingsBalance -= amount
  user.nairaBalance += nairaAmount
  user.updatedAt = Date.now()

  const transactionId = generateId()
  const transaction = {
    id: transactionId,
    userId,
    type: 'withdraw' as const,
    channel: 'simulated' as const,
    sourceRef: null,
    amount,
    amountNaira: nairaAmount,
    savingsAmount: -amount,
    savingsPercentage: 0,
    flexModeUsed: false,
    exchangeRate: fxQuote.rate,
    fxProvider: fxQuote.provider,
    fxQuoteTimestamp: fxQuote.asOf,
    fxQuoteStale: fxQuote.stale,
    status: 'completed' as const,
    createdAt: Date.now(),
  }

  await transactions.insertOne(transaction)
  await users.updateOne({ id: userId }, { $set: user })

  return {
    success: true,
    newSavingsBalance: user.savingsBalance,
    newNairaBalance: user.nairaBalance,
  }
}

export async function receiveFiat(
  userId: string,
  amountNaira: number,
  sourceRef?: string | null,
  savingsGoalId?: string | null
): Promise<FiatReceiveResult> {
  const result = await processInboundDeposit({
    userId,
    rail: 'fiat',
    amount: amountNaira,
    currency: 'NGN',
    reference: sourceRef || `fiat:${userId}:${amountNaira}:${Date.now()}`,
    sourceRef: sourceRef || null,
    savingsGoalId: savingsGoalId || null,
  })

  return result.settlement
}

export async function receiveFiatUsd(
  userId: string,
  amountUsd: number,
  sourceRef?: string | null,
  savingsGoalId?: string | null
): Promise<FiatReceiveResult> {
  const result = await processInboundDeposit({
    userId,
    rail: 'fiat',
    amount: amountUsd,
    currency: 'USD',
    reference: sourceRef || `fiat-usd:${userId}:${amountUsd}:${Date.now()}`,
    sourceRef: sourceRef || null,
    savingsGoalId: savingsGoalId || null,
  })

  return result.settlement
}

export async function updateSavingsPercentage(userId: string, percentage: number) {
  const users = await getUsersCollection()
  const userRecord = await users.findOne({ id: userId })

  if (!userRecord) throw new Error('User not found')

  const { _id, ...user } = userRecord
  if (percentage < 10 || percentage > 100) {
    throw new Error('Percentage must be between 10 and 100')
  }

  user.savingsPercentage = percentage
  user.updatedAt = Date.now()
  await users.updateOne({ id: userId }, { $set: user })

  return user
}

export async function activateFlexMode(userId: string) {
  const users = await getUsersCollection()
  const userRecord = await users.findOne({ id: userId })

  if (!userRecord) throw new Error('User not found')

  const { _id, ...user } = userRecord
  const now = Date.now()

  if (user.flexModeCooldownUntil && user.flexModeCooldownUntil > now) {
    throw new Error('Flex mode is on cooldown')
  }

  user.flexModeActive = true
  user.flexModeCooldownUntil = null
  user.updatedAt = now
  await users.updateOne({ id: userId }, { $set: user })

  return {
    success: true,
    flexModeActive: user.flexModeActive,
    flexModeCooldownUntil: user.flexModeCooldownUntil,
  }
}

export async function deactivateFlexMode(userId: string) {
  const users = await getUsersCollection()
  const userRecord = await users.findOne({ id: userId })

  if (!userRecord) throw new Error('User not found')

  const { _id, ...user } = userRecord
  user.flexModeActive = false
  user.updatedAt = Date.now()
  await users.updateOne({ id: userId }, { $set: user })

  return {
    success: true,
    flexModeActive: user.flexModeActive,
    flexModeCooldownUntil: user.flexModeCooldownUntil,
  }
}

export async function getUserTransactions(userId: string, limit = 10) {
  const transactions = await getTransactionsCollection()
  const userTransactions = await transactions
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()

  return userTransactions
}

export async function getRecentDeposits(
  userId: string,
  options?: { rail?: Deposit['rail']; limit?: number }
): Promise<RecentDepositView[]> {
  const deposits = await getDepositsCollection()
  const query = options?.rail ? { userId, rail: options.rail } : { userId }

  return deposits
    .find(query)
    .sort({ createdAt: -1 })
    .limit(options?.limit || 10)
    .toArray()
}

export async function getUserStats(userId: string) {
  const transactions = await getTransactionsCollection()
  const userTransactions = await transactions
    .find({ userId, type: { $in: ['receive', 'receive_fiat'] } })
    .toArray()

  const totalReceived = userTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalSaved = userTransactions.reduce((sum, t) => sum + t.savingsAmount, 0)

  return {
    totalReceived,
    totalSaved,
    averageSavingsPercentage:
      userTransactions.length > 0
        ? userTransactions.reduce((sum, t) => sum + t.savingsPercentage, 0) /
          userTransactions.length
        : 0,
    transactionCount: userTransactions.length,
  }
}
