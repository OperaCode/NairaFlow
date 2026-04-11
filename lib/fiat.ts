import { createHash } from 'crypto'
import { User, getUsersCollection } from './db/models'

export interface FiatInstructions {
  provider: 'paystack' | 'mock'
  mode: 'live' | 'demo'
  bankName: string
  accountName: string
  accountNumber: string
  reference: string
  qrPayload: string
  currency: 'NGN'
  railStatus: 'ready' | 'pending'
  providerLabel: string
}

function toMockAccountNumber(seed: string) {
  const hash = createHash('sha256').update(seed).digest('hex')
  const numeric = parseInt(hash.slice(0, 12), 16).toString().padStart(10, '0')
  return numeric.slice(0, 10)
}

async function updateFiatProfile(userId: string, updates: Partial<User>) {
  const users = await getUsersCollection()
  await users.updateOne(
    { id: userId },
    {
      $set: {
        ...updates,
        updatedAt: Date.now(),
      },
    }
  )
}

async function createMockInstructions(user: User): Promise<FiatInstructions> {
  const accountNumber = user.fiatAccountNumber || toMockAccountNumber(user.id)
  const bankName = user.fiatBankName || 'Demo Bank'
  const accountName = user.fiatAccountName || `NairaFlow/${user.email.split('@')[0]}`
  const reference = `NF-${user.id.toUpperCase()}`

  await updateFiatProfile(user.id, {
    fiatProvider: 'mock',
    fiatAccountNumber: accountNumber,
    fiatAccountName: accountName,
    fiatBankName: bankName,
  })

  return {
    provider: 'mock',
    mode: 'demo',
    bankName,
    accountName,
    accountNumber,
    reference,
    qrPayload: `BANK:${bankName};ACCOUNT:${accountNumber};NAME:${accountName};REF:${reference}`,
    currency: 'NGN',
    railStatus: 'ready',
    providerLabel: 'Demo Bank Transfer',
  }
}

async function createPaystackInstructions(user: User): Promise<FiatInstructions | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return null

  const headers = {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
  }

  try {
    const customerRes = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: user.email,
        first_name: user.email.split('@')[0],
        last_name: 'NairaFlow',
      }),
    })

    const customerJson = await customerRes.json()
    const customerCode = customerJson?.data?.customer_code as string | undefined

    if (!customerCode) return null

    const dvaRes = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerCode,
        preferred_bank: 'wema-bank',
      }),
    })

    const dvaJson = await dvaRes.json()
    const dva = dvaJson?.data
    if (!dva?.account_number || !dva?.bank?.name || !dva?.account_name) return null

    const reference = `NF-${user.id.toUpperCase()}`
    await updateFiatProfile(user.id, {
      fiatProvider: 'paystack',
      fiatAccountNumber: dva.account_number,
      fiatAccountName: dva.account_name,
      fiatBankName: dva.bank.name,
      fiatCustomerCode: customerCode,
      fiatDedicatedAccountId: typeof dva.id === 'number' ? dva.id : null,
      fiatProviderSlug: typeof dva?.bank?.slug === 'string' ? dva.bank.slug : 'wema-bank',
    })

    return {
      provider: 'paystack',
      mode: 'live',
      bankName: dva.bank.name,
      accountName: dva.account_name,
      accountNumber: dva.account_number,
      reference,
      qrPayload: `BANK:${dva.bank.name};ACCOUNT:${dva.account_number};NAME:${dva.account_name};REF:${reference}`,
      currency: 'NGN',
      railStatus: 'ready',
      providerLabel: 'Paystack Dedicated Account',
    }
  } catch {
    return null
  }
}

export async function getOrCreateFiatInstructions(userId: string) {
  const users = await getUsersCollection()
  const user = await users.findOne({ id: userId })
  if (!user) throw new Error('User not found')

  if (user.fiatAccountNumber && user.fiatAccountName && user.fiatBankName) {
    const reference = `NF-${user.id.toUpperCase()}`
    return {
      provider: user.fiatProvider || 'mock',
      mode: user.fiatProvider === 'paystack' ? 'live' : 'demo',
      bankName: user.fiatBankName,
      accountName: user.fiatAccountName,
      accountNumber: user.fiatAccountNumber,
      reference,
      qrPayload: `BANK:${user.fiatBankName};ACCOUNT:${user.fiatAccountNumber};NAME:${user.fiatAccountName};REF:${reference}`,
      currency: 'NGN',
      railStatus: 'ready',
      providerLabel:
        user.fiatProvider === 'paystack' ? 'Paystack Dedicated Account' : 'Demo Bank Transfer',
    } as FiatInstructions
  }

  const paystack = await createPaystackInstructions(user)
  if (paystack) return paystack

  return createMockInstructions(user)
}

export async function findUserByFiatCustomerCode(customerCode: string) {
  const users = await getUsersCollection()
  return users.findOne({ fiatCustomerCode: customerCode })
}

export async function findUserByEmail(email: string) {
  const users = await getUsersCollection()
  return users.findOne({ email: email.trim().toLowerCase() })
}

export async function syncPaystackDedicatedAccount(
  userId: string,
  payload: {
    customerCode?: string | null
    accountNumber?: string | null
    accountName?: string | null
    bankName?: string | null
    bankSlug?: string | null
    dedicatedAccountId?: number | null
  }
) {
  const updates: Partial<User> = {
    fiatProvider: 'paystack',
  }

  if (payload.customerCode) updates.fiatCustomerCode = payload.customerCode
  if (payload.accountNumber) updates.fiatAccountNumber = payload.accountNumber
  if (payload.accountName) updates.fiatAccountName = payload.accountName
  if (payload.bankName) updates.fiatBankName = payload.bankName
  if (payload.bankSlug) updates.fiatProviderSlug = payload.bankSlug
  if (typeof payload.dedicatedAccountId === 'number') {
    updates.fiatDedicatedAccountId = payload.dedicatedAccountId
  }

  await updateFiatProfile(userId, updates)
}
