import {
  generateId,
  generateWalletAddress,
  Session,
  User,
  getSessionsCollection,
  getUsersCollection,
} from './db/models'
import crypto from 'crypto'

// Simple password hashing (in production use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export async function registerUser(email: string, password: string) {
  const users = await getUsersCollection()
  const normalizedEmail = email.trim().toLowerCase()

  // Check if user exists
  const existingUser = await users.findOne({ email: normalizedEmail })
  if (existingUser) {
    throw new Error('User already exists')
  }

  const userId = generateId()
  const walletAddress = generateWalletAddress()
  const passwordHash = hashPassword(password)

  const user: User = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    walletAddress,
    linkedWalletAddress: null,
    linkedWalletProvider: null,
    lastOnchainSyncBlock: null,
    fiatProvider: 'mock',
    fiatAccountNumber: null,
    fiatAccountName: null,
    fiatBankName: null,
    fiatCustomerCode: null,
    fiatDedicatedAccountId: null,
    fiatProviderSlug: null,
    nairaBalance: 0,
    usdBalance: 0,
    savingsBalance: 0,
    savingsPercentage: 10,
    vaultEnabled: false,
    vaultAddress: null,
    flexModeActive: false,
    flexModeCooldownUntil: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await users.insertOne(user)
  return { userId, email: normalizedEmail, walletAddress }
}

export async function loginUser(email: string, password: string) {
  const users = await getUsersCollection()
  const sessions = await getSessionsCollection()
  const normalizedEmail = email.trim().toLowerCase()
  const user = await users.findOne({ email: normalizedEmail })

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid email or password')
  }

  // Create session
  const sessionId = generateId()
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

  const session: Session = {
    id: sessionId,
    userId: user.id,
    token,
    expiresAt,
  }

  await sessions.insertOne(session)

  return {
    userId: user.id,
    email: normalizedEmail,
    walletAddress: user.walletAddress,
    sessionId,
    token,
    expiresAt,
  }
}

export async function verifySession(token: string): Promise<{ userId: string } | null> {
  const sessions = await getSessionsCollection()

  const session = await sessions.findOne({
    token,
    expiresAt: { $gt: Date.now() },
  })

  if (!session) {
    return null
  }

  return { userId: session.userId }
}

export async function getUser(userId: string) {
  const users = await getUsersCollection()
  return users.findOne({ id: userId })
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const users = await getUsersCollection()
  const user = await users.findOne({ id: userId })
  if (!user) throw new Error('User not found')

  const { _id, ...userData } = user
  const updated = { ...userData, ...updates, updatedAt: Date.now() }
  await users.updateOne({ id: userId }, { $set: updated })
  return updated
}
