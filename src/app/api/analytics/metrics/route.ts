import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, format, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 3m, 1y
    const category = searchParams.get('category') || 'trainer' // trainer, client, platform
    const metrics = searchParams.get('metrics')?.split(',') || ['revenue', 'occupancy', 'clients']
    const trainerId = searchParams.get('trainerId')
    const clientId = searchParams.get('clientId')

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        trainerProfile: true,
        clientProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Calculate date range
    let startDate: Date
    let endDate = new Date()
    
    switch (period) {
      case '7d':
        startDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        break
      case '3m':
        startDate = subMonths(endDate, 3)
        break
      case '1y':
        startDate = subMonths(endDate, 12)
        break
      default:
        startDate = subDays(endDate, 7)
    }

    const result: any = {}

    // Revenue metrics
    if (metrics.includes('revenue')) {
      const revenueData = await calculateRevenueMetrics(decoded.userId, user, startDate, endDate, trainerId)
      result.revenue = revenueData
    }

    // Occupancy metrics
    if (metrics.includes('occupancy')) {
      const occupancyData = await calculateOccupancyMetrics(decoded.userId, user, startDate, endDate, trainerId)
      result.occupancy = occupancyData
    }

    // Client metrics
    if (metrics.includes('clients')) {
      const clientData = await calculateClientMetrics(decoded.userId, user, startDate, endDate, trainerId)
      result.clients = clientData
    }

    // Performance metrics
    if (metrics.includes('performance')) {
      const performanceData = await calculatePerformanceMetrics(decoded.userId, user, startDate, endDate, trainerId)
      result.performance = performanceData
    }

    // No-show rate
    if (metrics.includes('noshow')) {
      const noshowData = await calculateNoShowMetrics(decoded.userId, user, startDate, endDate, trainerId)
      result.noshow = noshowData
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar métricas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function calculateRevenueMetrics(userId: string, user: any, startDate: Date, endDate: Date, trainerId?: string) {
  const targetTrainerId = trainerId || user.trainerProfile?.id

  const payments = await prisma.payment.findMany({
    where: {
      status: 'succeeded',
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(targetTrainerId && {
        appointment: {
          trainerId: targetTrainerId
        }
      })
    },
    include: {
      appointment: {
        include: {
          trainer: true,
          client: true,
          service: true
        }
      }
    }
  })

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const trainerRevenue = payments.reduce((sum, payment) => sum + (payment.trainerAmount || 0), 0)
  const averageTicket = payments.length > 0 ? totalRevenue / payments.length : 0

  // Revenue by day for chart
  const revenueByDay = await groupPaymentsByPeriod(payments, 'day')

  // Revenue by service type
  const revenueByService = await groupRevenueByService(payments)

  return {
    total: totalRevenue,
    trainerAmount: trainerRevenue,
    platformAmount: totalRevenue - trainerRevenue,
    averageTicket,
    transactionCount: payments.length,
    revenueByDay,
    revenueByService,
    growth: await calculateGrowth(payments, startDate, endDate, 'revenue')
  }
}

async function calculateOccupancyMetrics(userId: string, user: any, startDate: Date, endDate: Date, trainerId?: string) {
  const targetTrainerId = trainerId || user.trainerProfile?.id

  if (!targetTrainerId) {
    return { occupancyRate: 0, totalSlots: 0, bookedSlots: 0, occupancyByDay: [] }
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      trainerId: targetTrainerId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const availability = await prisma.availability.findMany({
    where: {
      trainerId: targetTrainerId,
      isActive: true
    }
  })

  // Calculate total available slots based on availability
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const slotsPerDay = availability.reduce((sum, av) => {
    const startTime = parseInt(av.startTime.split(':')[0])
    const endTime = parseInt(av.endTime.split(':')[0])
    return sum + (endTime - startTime)
  }, 0)
  
  const totalSlots = totalDays * slotsPerDay
  const bookedSlots = appointments.filter(app => app.status !== 'CANCELLED').length
  const occupancyRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0

  // Occupancy by day
  const occupancyByDay = await groupAppointmentsByPeriod(appointments, 'day', totalSlots / totalDays)

  // Peak hours analysis
  const peakHours = await analyzePeakHours(appointments)

  return {
    occupancyRate,
    totalSlots,
    bookedSlots,
    occupancyByDay,
    peakHours,
    averageSlots: bookedSlots / totalDays
  }
}

async function calculateClientMetrics(userId: string, user: any, startDate: Date, endDate: Date, trainerId?: string) {
  const targetTrainerId = trainerId || user.trainerProfile?.id

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(targetTrainerId && { trainerId: targetTrainerId }),
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      client: {
        include: {
          user: true
        }
      }
    }
  })

  const uniqueClients = new Set(appointments.map(app => app.clientId))
  const activeClients = uniqueClients.size

  // New clients in period
  const newClients = await prisma.clientProfile.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(targetTrainerId && {
        trainers: {
          some: {
            id: targetTrainerId
          }
        }
      })
    }
  })

  // Client retention rate
  const previousPeriodStart = subDays(startDate, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const previousPeriodClients = await prisma.appointment.findMany({
    where: {
      ...(targetTrainerId && { trainerId: targetTrainerId }),
      date: {
        gte: previousPeriodStart,
        lt: startDate
      }
    },
    select: {
      clientId: true
    }
  })

  const previousUniqueClients = new Set(previousPeriodClients.map(app => app.clientId))
  const retainedClients = Array.from(uniqueClients).filter(clientId => previousUniqueClients.has(clientId))
  const retentionRate = previousUniqueClients.size > 0 ? (retainedClients.length / previousUniqueClients.size) * 100 : 0

  return {
    activeClients,
    newClients,
    retentionRate,
    averageSessionsPerClient: activeClients > 0 ? appointments.length / activeClients : 0,
    clientsByDay: await groupClientsByPeriod(appointments, 'day')
  }
}

async function calculatePerformanceMetrics(userId: string, user: any, startDate: Date, endDate: Date, trainerId?: string) {
  const targetTrainerId = trainerId || user.trainerProfile?.id

  if (!targetTrainerId) {
    return { rating: 0, totalReviews: 0, nps: 0 }
  }

  const reviews = await prisma.review.findMany({
    where: {
      trainerId: targetTrainerId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  // Calculate NPS (assuming 4-5 stars = promoters, 1-2 stars = detractors, 3 stars = passive)
  const promoters = reviews.filter(r => r.rating >= 4).length
  const detractors = reviews.filter(r => r.rating <= 2).length
  const nps = reviews.length > 0 ? ((promoters - detractors) / reviews.length) * 100 : 0

  return {
    rating: avgRating,
    totalReviews: reviews.length,
    nps,
    ratingDistribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    }
  }
}

async function calculateNoShowMetrics(userId: string, user: any, startDate: Date, endDate: Date, trainerId?: string) {
  const targetTrainerId = trainerId || user.trainerProfile?.id

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(targetTrainerId && { trainerId: targetTrainerId }),
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const totalAppointments = appointments.length
  const cancelledAppointments = appointments.filter(app => app.status === 'CANCELLED').length
  const noShowRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0

  return {
    noShowRate,
    totalCancellations: cancelledAppointments,
    noShowByDay: await groupCancellationsByPeriod(appointments, 'day')
  }
}

// Helper functions
async function groupPaymentsByPeriod(payments: any[], period: string) {
  const grouped: { [key: string]: number } = {}
  
  payments.forEach(payment => {
    const key = format(payment.createdAt, period === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM')
    grouped[key] = (grouped[key] || 0) + payment.amount
  })

  return Object.entries(grouped).map(([date, amount]) => ({ date, amount }))
}

async function groupRevenueByService(payments: any[]) {
  const grouped: { [key: string]: number } = {}
  
  payments.forEach(payment => {
    const serviceName = payment.appointment?.service?.name || 'Serviço Não Especificado'
    grouped[serviceName] = (grouped[serviceName] || 0) + payment.amount
  })

  return Object.entries(grouped).map(([service, amount]) => ({ service, amount }))
}

async function groupAppointmentsByPeriod(appointments: any[], period: string, totalSlotsPerPeriod: number) {
  const grouped: { [key: string]: number } = {}
  
  appointments.forEach(appointment => {
    if (appointment.status !== 'CANCELLED') {
      const key = format(appointment.date, period === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM')
      grouped[key] = (grouped[key] || 0) + 1
    }
  })

  return Object.entries(grouped).map(([date, booked]) => ({ 
    date, 
    booked, 
    total: totalSlotsPerPeriod,
    occupancy: (booked / totalSlotsPerPeriod) * 100 
  }))
}

async function groupClientsByPeriod(appointments: any[], period: string) {
  const grouped: { [key: string]: Set<string> } = {}
  
  appointments.forEach(appointment => {
    const key = format(appointment.date, period === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM')
    if (!grouped[key]) grouped[key] = new Set()
    grouped[key].add(appointment.clientId)
  })

  return Object.entries(grouped).map(([date, clientSet]) => ({ 
    date, 
    clients: clientSet.size 
  }))
}

async function groupCancellationsByPeriod(appointments: any[], period: string) {
  const grouped: { [key: string]: { total: number, cancelled: number } } = {}
  
  appointments.forEach(appointment => {
    const key = format(appointment.date, period === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM')
    if (!grouped[key]) grouped[key] = { total: 0, cancelled: 0 }
    grouped[key].total++
    if (appointment.status === 'CANCELLED') {
      grouped[key].cancelled++
    }
  })

  return Object.entries(grouped).map(([date, data]) => ({ 
    date, 
    total: data.total,
    cancelled: data.cancelled,
    rate: data.total > 0 ? (data.cancelled / data.total) * 100 : 0
  }))
}

async function analyzePeakHours(appointments: any[]) {
  const hourCounts: { [key: number]: number } = {}
  
  appointments.forEach(appointment => {
    const hour = appointment.startTime.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), appointments: count }))
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 5)
}

async function calculateGrowth(currentPeriodData: any[], startDate: Date, endDate: Date, metric: string) {
  const periodLength = endDate.getTime() - startDate.getTime()
  const previousPeriodStart = new Date(startDate.getTime() - periodLength)
  const previousPeriodEnd = startDate

  // This is a simplified growth calculation
  // In a real implementation, you'd want to calculate the same metric for the previous period
  const currentValue = currentPeriodData.length
  const previousValue = currentValue * 0.8 // Placeholder - implement proper previous period calculation

  return previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0
}