import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '12m'

    // Calculate date range
    let months = 12
    switch (period) {
      case '3m':
        months = 3
        break
      case '6m':
        months = 6
        break
      case '12m':
        months = 12
        break
      case '24m':
        months = 24
        break
    }

    const endDate = new Date()
    const startDate = subMonths(endDate, months)

    // Get platform metrics
    const metrics = {
      revenue: await getRevenueMetrics(startDate, endDate, months),
      users: await getUserMetrics(startDate, endDate, months),
      activity: await getActivityMetrics(startDate, endDate),
      business: await getBusinessMetrics(startDate, endDate)
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Erro ao buscar métricas da plataforma:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function getRevenueMetrics(startDate: Date, endDate: Date, months: number) {
  // Get all successful payments
  const payments = await prisma.payment.findMany({
    where: {
      status: 'succeeded',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      appointment: {
        include: {
          trainer: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const platformRevenue = payments.reduce((sum, p) => sum + (p.platformAmount || p.amount * 0.2), 0)
  const trainerRevenue = totalRevenue - platformRevenue

  // Calculate growth (comparing current month with previous month)
  const currentMonth = new Date()
  const currentMonthStart = startOfMonth(currentMonth)
  const previousMonthStart = startOfMonth(subMonths(currentMonth, 1))
  const previousMonthEnd = endOfMonth(subMonths(currentMonth, 1))

  const currentMonthPayments = payments.filter(p => p.createdAt >= currentMonthStart)
  const previousMonthPayments = payments.filter(p => 
    p.createdAt >= previousMonthStart && p.createdAt <= previousMonthEnd
  )

  const currentMonthRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0)
  const previousMonthRevenue = previousMonthPayments.reduce((sum, p) => sum + p.amount, 0)
  const growth = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0

  // Monthly trends
  const monthlyTrends = await getMonthlyRevenueTrends(payments, startDate, endDate)

  return {
    total: totalRevenue,
    platform: platformRevenue,
    trainer: trainerRevenue,
    growth,
    monthlyTrends
  }
}

async function getUserMetrics(startDate: Date, endDate: Date, months: number) {
  // Total users
  const totalUsers = await prisma.user.count()
  const totalTrainers = await prisma.user.count({ where: { role: 'TRAINER' } })
  const totalClients = await prisma.user.count({ where: { role: 'CLIENT' } })

  // New users this month
  const currentMonthStart = startOfMonth(new Date())
  const newThisMonth = await prisma.user.count({
    where: {
      createdAt: {
        gte: currentMonthStart
      }
    }
  })

  // Calculate growth
  const previousMonthStart = startOfMonth(subMonths(new Date(), 1))
  const previousMonthEnd = endOfMonth(subMonths(new Date(), 1))
  const previousMonthNew = await prisma.user.count({
    where: {
      createdAt: {
        gte: previousMonthStart,
        lte: previousMonthEnd
      }
    }
  })

  const growth = previousMonthNew > 0 
    ? ((newThisMonth - previousMonthNew) / previousMonthNew) * 100 
    : 0

  // Registration trends
  const registrationTrends = await getMonthlyRegistrationTrends(startDate, endDate)

  return {
    total: totalUsers,
    trainers: totalTrainers,
    clients: totalClients,
    newThisMonth,
    growth,
    registrationTrends
  }
}

async function getActivityMetrics(startDate: Date, endDate: Date) {
  // Appointments data
  const appointments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      trainer: {
        include: {
          user: true
        }
      }
    }
  })

  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0

  // Average rating
  const reviews = await prisma.review.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0

  // Top trainers
  const topTrainers = await getTopTrainers(startDate, endDate)

  return {
    totalAppointments,
    completedAppointments,
    completionRate,
    averageRating,
    topTrainers
  }
}

async function getBusinessMetrics(startDate: Date, endDate: Date) {
  // Active trainers (had at least one appointment)
  const activeTrainerIds = await prisma.appointment.findMany({
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

  const activeTrainers = activeTrainerIds.length

  // Average revenue per trainer
  const payments = await prisma.payment.findMany({
    where: {
      status: 'succeeded',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      appointment: {
        select: {
          trainerId: true
        }
      }
    }
  })

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const averageRevenuePerTrainer = activeTrainers > 0 ? totalRevenue / activeTrainers : 0

  // Top services
  const topServices = await getTopServices(startDate, endDate)

  // Churn rate (simplified calculation)
  const currentMonth = startOfMonth(new Date())
  const previousMonth = startOfMonth(subMonths(new Date(), 1))
  
  const usersAtStartOfMonth = await prisma.user.count({
    where: {
      createdAt: {
        lt: currentMonth
      }
    }
  })

  const usersWhoLeft = Math.max(0, usersAtStartOfMonth - (await prisma.user.count()))
  const churnRate = usersAtStartOfMonth > 0 ? (usersWhoLeft / usersAtStartOfMonth) * 100 : 0

  return {
    activeTrainers,
    averageRevenuePerTrainer,
    topServices,
    churnRate
  }
}

async function getMonthlyRevenueTrends(payments: any[], startDate: Date, endDate: Date) {
  const monthlyData: { [key: string]: { total: number, platform: number, trainer: number } } = {}

  // Initialize months
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (currentMonth <= endMonth) {
    const key = format(currentMonth, 'yyyy-MM')
    monthlyData[key] = { total: 0, platform: 0, trainer: 0 }
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
  }

  // Populate with payment data
  payments.forEach(payment => {
    const key = format(payment.createdAt, 'yyyy-MM')
    if (monthlyData[key]) {
      monthlyData[key].total += payment.amount
      monthlyData[key].platform += payment.platformAmount || (payment.amount * 0.2)
      monthlyData[key].trainer += payment.trainerAmount || (payment.amount * 0.8)
    }
  })

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    total: data.total,
    platform: data.platform,
    trainer: data.trainer
  }))
}

async function getMonthlyRegistrationTrends(startDate: Date, endDate: Date) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true,
      role: true
    }
  })

  const monthlyData: { [key: string]: { trainers: number, clients: number } } = {}

  // Initialize months
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (currentMonth <= endMonth) {
    const key = format(currentMonth, 'yyyy-MM')
    monthlyData[key] = { trainers: 0, clients: 0 }
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
  }

  // Populate with user data
  users.forEach(user => {
    const key = format(user.createdAt, 'yyyy-MM')
    if (monthlyData[key]) {
      if (user.role === 'TRAINER') {
        monthlyData[key].trainers++
      } else if (user.role === 'CLIENT') {
        monthlyData[key].clients++
      }
    }
  })

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    trainers: data.trainers,
    clients: data.clients
  }))
}

async function getTopTrainers(startDate: Date, endDate: Date) {
  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      },
      status: {
        not: 'CANCELLED'
      }
    },
    include: {
      trainer: {
        include: {
          user: true
        }
      },
      payment: true
    }
  })

  const trainerStats: { 
    [key: string]: { 
      id: string, 
      name: string, 
      appointments: number, 
      revenue: number,
      ratings: number[]
    } 
  } = {}

  appointments.forEach(appointment => {
    const trainerId = appointment.trainerId
    const trainerName = appointment.trainer.user.name
    
    if (!trainerStats[trainerId]) {
      trainerStats[trainerId] = {
        id: trainerId,
        name: trainerName,
        appointments: 0,
        revenue: 0,
        ratings: []
      }
    }
    
    trainerStats[trainerId].appointments++
    trainerStats[trainerId].revenue += appointment.payment?.amount || 0
  })

  // Get ratings for top trainers
  const ratings = await prisma.review.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      trainerId: true,
      rating: true
    }
  })

  ratings.forEach(rating => {
    if (trainerStats[rating.trainerId]) {
      trainerStats[rating.trainerId].ratings.push(rating.rating)
    }
  })

  return Object.values(trainerStats)
    .map(trainer => ({
      ...trainer,
      rating: trainer.ratings.length > 0 
        ? trainer.ratings.reduce((sum, r) => sum + r, 0) / trainer.ratings.length 
        : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

async function getTopServices(startDate: Date, endDate: Date) {
  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      },
      status: {
        not: 'CANCELLED'
      }
    },
    include: {
      service: true
    }
  })

  const serviceStats: { [key: string]: { name: string, count: number } } = {}

  appointments.forEach(appointment => {
    const serviceName = appointment.service?.name || 'Serviço Personalizado'
    
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = { name: serviceName, count: 0 }
    }
    
    serviceStats[serviceName].count++
  })

  return Object.values(serviceStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}