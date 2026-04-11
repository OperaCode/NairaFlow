import { NextRequest, NextResponse } from 'next/server'
import { MongoNetworkError, MongoServerError } from 'mongodb'
import { registerUser } from '@/lib/auth'

function getMongoTargetLabel(uri?: string) {
  if (!uri) return 'configured MongoDB target'
  if (uri.startsWith('mongodb+srv://')) return 'MongoDB Atlas cluster'
  if (uri.startsWith('mongodb://')) return 'MongoDB server'
  return 'configured MongoDB target'
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const result = await registerUser(email, password)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.userId,
          email: result.email,
          walletAddress: result.walletAddress,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    if (message === 'User already exists') {
      return NextResponse.json({ error: message }, { status: 409 })
    }

    if (message.includes('Missing MONGODB_URI')) {
      return NextResponse.json({ error: 'MONGODB_URI is not set in environment variables' }, { status: 500 })
    }

    if (error instanceof MongoNetworkError || message.toLowerCase().includes('econnrefused')) {
      const target = getMongoTargetLabel(process.env.MONGODB_URI)
      return NextResponse.json(
        { error: `Cannot connect to ${target}. Check MONGODB_URI, DB network access, and credentials.` },
        { status: 500 }
      )
    }

    if (error instanceof MongoServerError) {
      return NextResponse.json(
        { error: 'MongoDB server error. Check your connection string and user permissions.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
