import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, findUserByFiatCustomerCode, syncPaystackDedicatedAccount } from '@/lib/fiat'
import { receiveFiat } from '@/lib/wallet'

function verifyPaystackSignature(rawBody: string, signature: string, secret: string) {
  const digest = createHmac('sha512', secret).update(rawBody).digest('hex')
  const expected = Buffer.from(digest, 'utf8')
  const actual = Buffer.from(signature, 'utf8')
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 })
    }

    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''
    if (!signature || !verifyPaystackSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)

    if (payload?.event === 'dedicatedaccount.assign.success') {
      const customerCode = payload?.data?.customer?.customer_code || payload?.data?.customer_code
      const email = payload?.data?.customer?.email || payload?.data?.email
      const user =
        (customerCode ? await findUserByFiatCustomerCode(customerCode) : null) ||
        (typeof email === 'string' ? await findUserByEmail(email) : null)

      if (!user) {
        return NextResponse.json({ error: 'No matching user for dedicated account assignment' }, { status: 404 })
      }

      await syncPaystackDedicatedAccount(user.id, {
        customerCode,
        accountNumber: payload?.data?.account_number,
        accountName: payload?.data?.account_name,
        bankName: payload?.data?.bank?.name,
        bankSlug: payload?.data?.bank?.slug,
        dedicatedAccountId: payload?.data?.id,
      })

      return NextResponse.json({ success: true, assignmentUpdated: true })
    }

    if (payload?.event !== 'charge.success') {
      return NextResponse.json({ success: true, ignored: true })
    }

    const customerCode = payload?.data?.customer?.customer_code
    const amountKobo = payload?.data?.amount
    const authorizationChannel = payload?.data?.authorization?.channel
    if (!customerCode || typeof amountKobo !== 'number') {
      return NextResponse.json({ error: 'Missing customer or amount' }, { status: 400 })
    }
    if (authorizationChannel && authorizationChannel !== 'dedicated_nuban') {
      return NextResponse.json({ success: true, ignored: true, reason: 'Unsupported charge channel' })
    }

    const user = await findUserByFiatCustomerCode(customerCode)
    if (!user) {
      return NextResponse.json({ error: 'No matching user' }, { status: 404 })
    }

    const reference = payload?.data?.reference
    const sourceRef = reference ? `paystack:${reference}` : `paystack:event:${payload?.data?.id || Date.now()}`
    await receiveFiat(user.id, amountKobo / 100, sourceRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
