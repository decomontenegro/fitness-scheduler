import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const validateVoucherSchema = z.object({
  code: z.string().min(3).max(50),
  amount: z.number().positive().optional() // For minimum order validation
})

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateVoucherSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { code, amount } = validation.data

    // Find voucher
    const voucher = await prisma.voucher.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() }
      },
      include: {
        voucherUsages: {
          where: { userId: user.id }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Invalid or expired voucher code' },
        { status: 400 }
      )
    }

    // Check if user-specific voucher
    if (voucher.userId && voucher.userId !== user.id) {
      return NextResponse.json(
        { error: 'This voucher is not available for your account' },
        { status: 400 }
      )
    }

    // Check global usage limits
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json(
        { error: 'Voucher usage limit exceeded' },
        { status: 400 }
      )
    }

    // Check per-user usage limits
    if (voucher.voucherUsages.length >= voucher.maxUsesPerUser) {
      return NextResponse.json(
        { error: 'You have already used this voucher the maximum number of times' },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (amount && voucher.minAmount && amount < voucher.minAmount) {
      return NextResponse.json(
        { 
          error: `Minimum order amount of R$ ${voucher.minAmount.toFixed(2)} required for this voucher` 
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (amount) {
      if (voucher.type === 'percentage') {
        discountAmount = (amount * voucher.amount) / 100
      } else {
        discountAmount = Math.min(voucher.amount, amount)
      }
    }

    return NextResponse.json({
      success: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        description: voucher.description,
        type: voucher.type,
        amount: voucher.amount,
        discountAmount: discountAmount,
        minAmount: voucher.minAmount,
        applicableTo: voucher.applicableTo,
        remainingUses: voucher.maxUses ? voucher.maxUses - voucher.usedCount : null,
        userRemainingUses: voucher.maxUsesPerUser - voucher.voucherUsages.length,
        validUntil: voucher.validUntil
      }
    })

  } catch (error) {
    console.error('Validate voucher error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's available vouchers
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Get available vouchers (either public or user-specific)
    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { userId: null }, // Public vouchers
          { userId: user.id } // User-specific vouchers
        ]
      },
      include: {
        voucherUsages: {
          where: { userId: user.id }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filter out vouchers that have reached usage limits
    const availableVouchers = vouchers.filter(voucher => {
      // Check global usage limit
      if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
        return false
      }
      
      // Check per-user usage limit
      if (voucher.voucherUsages.length >= voucher.maxUsesPerUser) {
        return false
      }
      
      return true
    })

    // Get user's voucher usage history
    const voucherHistory = await prisma.voucherUsage.findMany({
      where: { userId: user.id },
      include: {
        voucher: {
          select: {
            code: true,
            name: true,
            type: true,
            amount: true
          }
        }
      },
      orderBy: { usedAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      availableVouchers: availableVouchers.map(voucher => ({
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        description: voucher.description,
        type: voucher.type,
        amount: voucher.amount,
        minAmount: voucher.minAmount,
        applicableTo: voucher.applicableTo,
        remainingUses: voucher.maxUses ? voucher.maxUses - voucher.usedCount : null,
        userRemainingUses: voucher.maxUsesPerUser - voucher.voucherUsages.length,
        validUntil: voucher.validUntil
      })),
      usageHistory: voucherHistory.map(usage => ({
        id: usage.id,
        voucher: usage.voucher,
        discountAmount: usage.discountAmount,
        usedAt: usage.usedAt
      }))
    })

  } catch (error) {
    console.error('Get vouchers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}