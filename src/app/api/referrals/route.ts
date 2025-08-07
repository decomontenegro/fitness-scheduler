import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const createReferralSchema = z.object({
  referredEmail: z.string().email(),
  rewardAmount: z.number().positive().default(50)
})

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createReferralSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { referredEmail, rewardAmount } = validation.data

    // Check if referred user exists
    const referredUser = await prisma.user.findUnique({
      where: { email: referredEmail }
    })

    if (!referredUser) {
      return NextResponse.json(
        { error: 'Referred user not found. They need to register first.' },
        { status: 400 }
      )
    }

    if (referredUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      )
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findUnique({
      where: {
        referrerId_referredId: {
          referrerId: user.id,
          referredId: referredUser.id
        }
      }
    })

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Referral already exists for this user' },
        { status: 400 }
      )
    }

    // Create referral
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days to complete

    const referral = await prisma.referral.create({
      data: {
        referrerId: user.id,
        referredId: referredUser.id,
        status: 'pending',
        rewardAmount,
        expiresAt,
        metadata: {
          createdFrom: 'web',
          ipAddress: request.ip || 'unknown'
        }
      },
      include: {
        referrer: { select: { name: true, email: true } },
        referred: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        status: referral.status,
        rewardAmount: referral.rewardAmount,
        expiresAt: referral.expiresAt,
        referred: {
          name: referral.referred.name,
          email: referral.referred.email
        }
      }
    })

  } catch (error) {
    console.error('Create referral error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's referral data
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'made' or 'received'

    // Get referrals made by user
    const referralsMade = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referred: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get referrals where user was referred
    const referralsReceived = await prisma.referral.findMany({
      where: { referredId: user.id },
      include: {
        referrer: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate statistics
    const stats = {
      totalReferrals: referralsMade.length,
      completedReferrals: referralsMade.filter(r => r.status === 'completed').length,
      pendingReferrals: referralsMade.filter(r => r.status === 'pending').length,
      totalEarnings: referralsMade
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.rewardAmount, 0),
      wasReferred: referralsReceived.length > 0,
      referredBy: referralsReceived.length > 0 ? referralsReceived[0].referrer : null
    }

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/register?ref=${user.id}`

    return NextResponse.json({
      success: true,
      referralLink,
      stats,
      referralsMade: referralsMade.map(referral => ({
        id: referral.id,
        status: referral.status,
        rewardAmount: referral.rewardAmount,
        completedAt: referral.completedAt,
        expiresAt: referral.expiresAt,
        createdAt: referral.createdAt,
        referred: {
          name: referral.referred.name,
          email: referral.referred.email
        }
      })),
      referralsReceived: referralsReceived.map(referral => ({
        id: referral.id,
        status: referral.status,
        rewardAmount: referral.rewardAmount,
        completedAt: referral.completedAt,
        createdAt: referral.createdAt,
        referrer: {
          name: referral.referrer.name,
          email: referral.referrer.email
        }
      }))
    })

  } catch (error) {
    console.error('Get referrals error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Complete referral (called when referred user makes first payment)
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { referralId, action } = body

    if (action !== 'complete') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Find the referral
    const referral = await prisma.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { referrerId: user.id },
          { referredId: user.id }
        ],
        status: 'pending',
        expiresAt: { gte: new Date() }
      },
      include: {
        referrer: true,
        referred: true
      }
    })

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found or already completed' },
        { status: 404 }
      )
    }

    // Update referral status
    const updatedReferral = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    // Add reward to referrer's wallet
    await prisma.walletTransaction.create({
      data: {
        userId: referral.referrerId,
        type: 'credit',
        amount: referral.rewardAmount,
        description: `Referral bonus for ${referral.referred.name}`,
        referralId: referral.id,
        metadata: {
          type: 'referral_bonus',
          referredUserId: referral.referredId,
          referredUserName: referral.referred.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      referral: {
        id: updatedReferral.id,
        status: updatedReferral.status,
        completedAt: updatedReferral.completedAt,
        rewardAmount: updatedReferral.rewardAmount
      }
    })

  } catch (error) {
    console.error('Complete referral error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}