import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const walletTransactionSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.number().positive(),
  description: z.string(),
  appointmentId: z.string().optional(),
  paymentId: z.string().optional(),
  referralId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    // Get wallet balance
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: user.id },
      select: { amount: true, type: true }
    })

    const balance = transactions.reduce((total, transaction) => {
      return transaction.type === 'credit' 
        ? total + transaction.amount 
        : total - transaction.amount
    }, 0)

    // Get recent transactions
    const recentTransactions = await prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const totalTransactions = await prisma.walletTransaction.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      wallet: {
        balance: Math.max(0, balance), // Ensure non-negative balance
        currency: 'BRL'
      },
      transactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt,
        appointmentId: transaction.appointmentId,
        paymentId: transaction.paymentId,
        referralId: transaction.referralId
      })),
      pagination: {
        page,
        limit,
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit)
      }
    })

  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create wallet transaction (credit/debit)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = walletTransactionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { type, amount, description, appointmentId, paymentId, referralId } = validation.data

    // For debit transactions, check if user has sufficient balance
    if (type === 'debit') {
      const currentTransactions = await prisma.walletTransaction.findMany({
        where: { userId: user.id },
        select: { amount: true, type: true }
      })

      const currentBalance = currentTransactions.reduce((total, transaction) => {
        return transaction.type === 'credit' 
          ? total + transaction.amount 
          : total - transaction.amount
      }, 0)

      if (currentBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        )
      }
    }

    const transaction = await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type,
        amount,
        description,
        appointmentId,
        paymentId,
        referralId,
        metadata: {
          createdBy: 'user',
          ipAddress: request.ip || 'unknown'
        }
      }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt
      }
    })

  } catch (error) {
    console.error('Create wallet transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}