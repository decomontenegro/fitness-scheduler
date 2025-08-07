import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

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
    const period = searchParams.get('period') || '6m'

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        clientProfile: true
      }
    })

    if (!user || !user.clientProfile) {
      return NextResponse.json({ error: 'Perfil de cliente não encontrado' }, { status: 404 })
    }

    // Calculate date range
    let months = 6
    switch (period) {
      case '3m':
        months = 3
        break
      case '6m':
        months = 6
        break
      case '1y':
        months = 12
        break
    }

    const startDate = subMonths(new Date(), months)
    const now = new Date()

    // Get all completed appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: user.clientProfile.id,
        date: {
          gte: startDate
        },
        status: 'COMPLETED'
      },
      include: {
        trainer: {
          include: {
            user: true
          }
        },
        service: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate statistics
    const stats = {
      totalSessions: appointments.length,
      thisWeekSessions: await getThisWeekSessions(appointments),
      thisMonthSessions: await getThisMonthSessions(appointments),
      averageFrequency: await calculateAverageFrequency(appointments, months),
      favoriteTrainer: await getFavoriteTrainer(appointments),
      favoriteService: await getFavoriteService(appointments),
      consistencyScore: await calculateConsistencyScore(appointments, months),
      weeklyBreakdown: await getWeeklyBreakdown(appointments),
      monthlyBreakdown: await getMonthlyBreakdown(appointments),
      serviceBreakdown: await getServiceBreakdown(appointments)
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erro ao buscar estatísticas de treino:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function getThisWeekSessions(appointments: any[]) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  return appointments.filter(appointment => 
    appointment.date >= weekStart && appointment.date <= weekEnd
  ).length
}

async function getThisMonthSessions(appointments: any[]) {
  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())

  return appointments.filter(appointment => 
    appointment.date >= monthStart && appointment.date <= monthEnd
  ).length
}

async function calculateAverageFrequency(appointments: any[], months: number) {
  if (appointments.length === 0) return 0
  
  const weeks = months * 4.33 // Average weeks per month
  return appointments.length / weeks
}

async function getFavoriteTrainer(appointments: any[]) {
  if (appointments.length === 0) return 'Nenhum'

  const trainerCounts: { [key: string]: { name: string, count: number } } = {}

  appointments.forEach(appointment => {
    const trainerId = appointment.trainer.id
    const trainerName = appointment.trainer.user.name
    
    if (!trainerCounts[trainerId]) {
      trainerCounts[trainerId] = { name: trainerName, count: 0 }
    }
    trainerCounts[trainerId].count++
  })

  let favoriteTrainer = { name: 'Nenhum', count: 0 }
  Object.values(trainerCounts).forEach(trainer => {
    if (trainer.count > favoriteTrainer.count) {
      favoriteTrainer = trainer
    }
  })

  return favoriteTrainer.name
}

async function getFavoriteService(appointments: any[]) {
  if (appointments.length === 0) return 'Nenhum'

  const serviceCounts: { [key: string]: number } = {}

  appointments.forEach(appointment => {
    const serviceName = appointment.service?.name || 'Serviço Personalizado'
    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1
  })

  let favoriteService = 'Nenhum'
  let maxCount = 0

  Object.entries(serviceCounts).forEach(([service, count]) => {
    if (count > maxCount) {
      maxCount = count
      favoriteService = service
    }
  })

  return favoriteService
}

async function calculateConsistencyScore(appointments: any[], months: number) {
  if (appointments.length === 0) return 0

  // Calculate how many weeks out of total weeks had at least one workout
  const weeks = Math.floor(months * 4.33)
  const weeksWithWorkouts = new Set()

  appointments.forEach(appointment => {
    const weekStart = startOfWeek(appointment.date, { weekStartsOn: 1 })
    weeksWithWorkouts.add(weekStart.getTime())
  })

  return Math.min(100, Math.round((weeksWithWorkouts.size / weeks) * 100))
}

async function getWeeklyBreakdown(appointments: any[]) {
  const weeklyData: { [key: string]: number } = {}

  appointments.forEach(appointment => {
    const weekStart = startOfWeek(appointment.date, { weekStartsOn: 1 })
    const weekKey = weekStart.toISOString().split('T')[0]
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1
  })

  return Object.entries(weeklyData)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
}

async function getMonthlyBreakdown(appointments: any[]) {
  const monthlyData: { [key: string]: number } = {}

  appointments.forEach(appointment => {
    const monthStart = startOfMonth(appointment.date)
    const monthKey = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
  })

  return Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

async function getServiceBreakdown(appointments: any[]) {
  const serviceData: { [key: string]: number } = {}

  appointments.forEach(appointment => {
    const serviceName = appointment.service?.name || 'Serviço Personalizado'
    serviceData[serviceName] = (serviceData[serviceName] || 0) + 1
  })

  const total = appointments.length

  return Object.entries(serviceData)
    .map(([service, count]) => ({
      service,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
}