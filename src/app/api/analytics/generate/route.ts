import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    // This endpoint will be called by a cron job to generate analytics metrics
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    const targetDate = new Date(date)
    const startDate = startOfDay(targetDate)
    const endDate = endOfDay(targetDate)

    console.log(`Generating analytics for date: ${format(targetDate, 'yyyy-MM-dd')}`)

    // Get all trainers
    const trainers = await prisma.trainerProfile.findMany({
      include: {
        user: true
      }
    })

    for (const trainer of trainers) {
      await generateTrainerMetrics(trainer.id, trainer.user.id, targetDate)
    }

    // Generate platform-wide metrics
    await generatePlatformMetrics(targetDate)

    return NextResponse.json({ 
      message: 'Analytics generated successfully',
      date: format(targetDate, 'yyyy-MM-dd'),
      trainersProcessed: trainers.length
    })

  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateTrainerMetrics(trainerId: string, userId: string, date: Date) {
  const startDate = startOfDay(date)
  const endDate = endOfDay(date)

  // Revenue metrics
  const payments = await prisma.payment.findMany({
    where: {
      status: 'succeeded',
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      appointment: {
        trainerId: trainerId
      }
    }
  })

  const dailyRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const trainerRevenue = payments.reduce((sum, payment) => sum + (payment.trainerAmount || 0), 0)

  // Store revenue metrics
  await upsertMetric(userId, trainerId, null, 'revenue_total', 'trainer', dailyRevenue, 'currency', date)
  await upsertMetric(userId, trainerId, null, 'revenue_trainer', 'trainer', trainerRevenue, 'currency', date)
  await upsertMetric(userId, trainerId, null, 'transaction_count', 'trainer', payments.length, 'count', date)

  // Occupancy metrics
  const appointments = await prisma.appointment.findMany({
    where: {
      trainerId: trainerId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const availability = await prisma.availability.findMany({
    where: {
      trainerId: trainerId,
      isActive: true
    }
  })

  const slotsPerDay = availability.reduce((sum, av) => {
    const [startHour] = av.startTime.split(':').map(Number)
    const [endHour] = av.endTime.split(':').map(Number)
    return sum + (endHour - startHour)
  }, 0)

  const bookedSlots = appointments.filter(app => app.status !== 'CANCELLED').length
  const occupancyRate = slotsPerDay > 0 ? (bookedSlots / slotsPerDay) * 100 : 0

  await upsertMetric(userId, trainerId, null, 'occupancy_rate', 'trainer', occupancyRate, 'percentage', date)
  await upsertMetric(userId, trainerId, null, 'slots_booked', 'trainer', bookedSlots, 'count', date)
  await upsertMetric(userId, trainerId, null, 'slots_total', 'trainer', slotsPerDay, 'count', date)

  // Client metrics
  const uniqueClients = new Set(appointments.map(app => app.clientId))
  await upsertMetric(userId, trainerId, null, 'active_clients', 'trainer', uniqueClients.size, 'count', date)

  // Performance metrics
  const reviews = await prisma.review.findMany({
    where: {
      trainerId: trainerId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    await upsertMetric(userId, trainerId, null, 'rating_average', 'trainer', avgRating, 'rating', date)
    await upsertMetric(userId, trainerId, null, 'reviews_count', 'trainer', reviews.length, 'count', date)

    // Calculate NPS
    const promoters = reviews.filter(r => r.rating >= 4).length
    const detractors = reviews.filter(r => r.rating <= 2).length
    const nps = ((promoters - detractors) / reviews.length) * 100
    await upsertMetric(userId, trainerId, null, 'nps_score', 'trainer', nps, 'percentage', date)
  }

  // No-show metrics
  const cancelledAppointments = appointments.filter(app => app.status === 'CANCELLED').length
  const noShowRate = appointments.length > 0 ? (cancelledAppointments / appointments.length) * 100 : 0
  await upsertMetric(userId, trainerId, null, 'noshow_rate', 'trainer', noShowRate, 'percentage', date)
}

async function generatePlatformMetrics(date: Date) {
  const startDate = startOfDay(date)
  const endDate = endOfDay(date)

  // Platform-wide revenue
  const allPayments = await prisma.payment.findMany({
    where: {
      status: 'succeeded',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const platformRevenue = allPayments.reduce((sum, payment) => sum + (payment.platformAmount || 0), 0)

  await upsertMetric(null, null, null, 'revenue_total', 'platform', totalRevenue, 'currency', date)
  await upsertMetric(null, null, null, 'revenue_platform', 'platform', platformRevenue, 'currency', date)
  await upsertMetric(null, null, null, 'transaction_count', 'platform', allPayments.length, 'count', date)

  // Platform-wide users
  const totalUsers = await prisma.user.count({
    where: {
      createdAt: {
        lte: endDate
      }
    }
  })

  const newUsersToday = await prisma.user.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  await upsertMetric(null, null, null, 'users_total', 'platform', totalUsers, 'count', date)
  await upsertMetric(null, null, null, 'users_new', 'platform', newUsersToday, 'count', date)

  // Active trainers
  const activeTrainers = await prisma.appointment.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      },
      status: {
        not: 'CANCELLED'
      }
    },
    select: {
      trainerId: true
    },
    distinct: ['trainerId']
  })

  await upsertMetric(null, null, null, 'trainers_active', 'platform', activeTrainers.length, 'count', date)
}

async function upsertMetric(
  userId: string | null,
  trainerId: string | null,
  clientId: string | null,
  metricType: string,
  category: string,
  value: number,
  unit: string,
  date: Date
) {
  try {
    await prisma.analyticsMetric.upsert({
      where: {
        userId_trainerId_clientId_metricType_date: {
          userId: userId || '',
          trainerId: trainerId || '',
          clientId: clientId || '',
          metricType,
          date
        }
      },
      create: {
        userId,
        trainerId,
        clientId,
        metricType,
        category,
        value,
        unit,
        date,
        period: 'daily',
        metadata: {}
      },
      update: {
        value,
        updatedAt: new Date()
      }
    })
  } catch (error) {
    // If compound unique constraint doesn't exist, use regular create/update logic
    const existing = await prisma.analyticsMetric.findFirst({
      where: {
        userId,
        trainerId,
        clientId,
        metricType,
        date,
        period: 'daily'
      }
    })

    if (existing) {
      await prisma.analyticsMetric.update({
        where: { id: existing.id },
        data: { value, updatedAt: new Date() }
      })
    } else {
      await prisma.analyticsMetric.create({
        data: {
          userId,
          trainerId,
          clientId,
          metricType,
          category,
          value,
          unit,
          date,
          period: 'daily',
          metadata: {}
        }
      })
    }
  }
}