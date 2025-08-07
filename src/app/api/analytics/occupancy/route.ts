import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { subDays, subMonths, format, getDay, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns'

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
    const period = searchParams.get('period') || '30d'
    const trainerId = searchParams.get('trainerId')
    const view = searchParams.get('view') || 'overview' // overview, heatmap, trends

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        trainerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

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
      case '6m':
        startDate = subMonths(endDate, 6)
        break
      default:
        startDate = subDays(endDate, 30)
    }

    const targetTrainerId = trainerId || user.trainerProfile?.id

    if (!targetTrainerId) {
      return NextResponse.json({ error: 'Trainer ID requerido' }, { status: 400 })
    }

    const occupancyData = await getOccupancyAnalysis(targetTrainerId, startDate, endDate, view)

    return NextResponse.json(occupancyData)
  } catch (error) {
    console.error('Erro ao buscar análise de ocupação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function getOccupancyAnalysis(trainerId: string, startDate: Date, endDate: Date, view: string) {
  // Get trainer availability
  const availability = await prisma.availability.findMany({
    where: {
      trainerId,
      isActive: true
    }
  })

  // Get appointments in the period
  const appointments = await prisma.appointment.findMany({
    where: {
      trainerId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      service: true,
      client: {
        include: {
          user: true
        }
      }
    }
  })

  // Calculate available slots per day
  const availableSlotsPerDay = calculateAvailableSlots(availability)
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalAvailableSlots = totalDays * availableSlotsPerDay

  // Filter booked appointments (exclude cancelled)
  const bookedAppointments = appointments.filter(app => app.status !== 'CANCELLED')
  const totalBookedSlots = bookedAppointments.length

  const overallOccupancyRate = totalAvailableSlots > 0 ? (totalBookedSlots / totalAvailableSlots) * 100 : 0

  let result: any = {
    overview: {
      occupancyRate: overallOccupancyRate,
      totalSlots: totalAvailableSlots,
      bookedSlots: totalBookedSlots,
      availableSlots: totalAvailableSlots - totalBookedSlots,
      averageSlotsPerDay: availableSlotsPerDay
    }
  }

  if (view === 'overview' || view === 'all') {
    // Daily occupancy trends
    result.trends = await calculateOccupancyTrends(appointments, availability, startDate, endDate)
    
    // Peak hours analysis
    result.peakHours = await analyzePeakHours(bookedAppointments)
    
    // Day of week analysis
    result.dayOfWeekAnalysis = await analyzeDayOfWeek(bookedAppointments, availability)
  }

  if (view === 'heatmap' || view === 'all') {
    // Heatmap data (hour x day of week)
    result.heatmap = await generateOccupancyHeatmap(bookedAppointments, availability)
  }

  if (view === 'trends' || view === 'all') {
    // Weekly trends
    result.weeklyTrends = await calculateWeeklyTrends(appointments, availability, startDate, endDate)
    
    // Service type occupancy
    result.serviceOccupancy = await analyzeServiceOccupancy(bookedAppointments)
  }

  // Capacity utilization recommendations
  result.recommendations = await generateOccupancyRecommendations(result, availability)

  return result
}

function calculateAvailableSlots(availability: any[]) {
  return availability.reduce((total, slot) => {
    const [startHour] = slot.startTime.split(':').map(Number)
    const [endHour] = slot.endTime.split(':').map(Number)
    return total + (endHour - startHour)
  }, 0)
}

async function calculateOccupancyTrends(appointments: any[], availability: any[], startDate: Date, endDate: Date) {
  const dailyData: { [key: string]: { total: number, booked: number } } = {}
  const availableSlotsPerDay = calculateAvailableSlots(availability)

  // Initialize all days
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  days.forEach(day => {
    const key = format(day, 'yyyy-MM-dd')
    dailyData[key] = { total: availableSlotsPerDay, booked: 0 }
  })

  // Count booked appointments
  appointments.forEach(appointment => {
    if (appointment.status !== 'CANCELLED') {
      const key = format(appointment.date, 'yyyy-MM-dd')
      if (dailyData[key]) {
        dailyData[key].booked++
      }
    }
  })

  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    occupancyRate: data.total > 0 ? (data.booked / data.total) * 100 : 0,
    bookedSlots: data.booked,
    availableSlots: data.total - data.booked,
    totalSlots: data.total
  }))
}

async function analyzePeakHours(appointments: any[]) {
  const hourCounts: { [key: number]: number } = {}
  
  // Initialize all hours
  for (let i = 6; i <= 22; i++) {
    hourCounts[i] = 0
  }

  appointments.forEach(appointment => {
    const hour = appointment.startTime.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({
      hour: parseInt(hour),
      timeLabel: `${hour.padStart(2, '0')}:00`,
      appointments: count,
      percentage: appointments.length > 0 ? (count / appointments.length) * 100 : 0
    }))
    .sort((a, b) => a.hour - b.hour)
}

async function analyzeDayOfWeek(appointments: any[], availability: any[]) {
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const dayData: { [key: number]: { booked: number, available: number } } = {}

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    dayData[i] = { booked: 0, available: 0 }
  }

  // Calculate available slots per day of week
  availability.forEach(slot => {
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .indexOf(slot.dayOfWeek.toLowerCase())
    if (dayIndex >= 0) {
      const [startHour] = slot.startTime.split(':').map(Number)
      const [endHour] = slot.endTime.split(':').map(Number)
      dayData[dayIndex].available += (endHour - startHour)
    }
  })

  // Count booked appointments
  appointments.forEach(appointment => {
    if (appointment.status !== 'CANCELLED') {
      const dayOfWeek = getDay(appointment.date)
      dayData[dayOfWeek].booked++
    }
  })

  return Object.entries(dayData).map(([day, data]) => ({
    dayOfWeek: parseInt(day),
    dayName: dayNames[parseInt(day)],
    occupancyRate: data.available > 0 ? (data.booked / data.available) * 100 : 0,
    bookedSlots: data.booked,
    availableSlots: data.available - data.booked,
    totalSlots: data.available
  }))
}

async function generateOccupancyHeatmap(appointments: any[], availability: any[]) {
  const heatmapData: { [key: string]: number } = {}
  
  // Initialize grid (7 days x 17 hours: 6AM to 10PM)
  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour <= 22; hour++) {
      const key = `${day}-${hour}`
      heatmapData[key] = 0
    }
  }

  // Count appointments
  appointments.forEach(appointment => {
    if (appointment.status !== 'CANCELLED') {
      const dayOfWeek = getDay(appointment.date)
      const hour = appointment.startTime.getHours()
      const key = `${dayOfWeek}-${hour}`
      heatmapData[key] = (heatmapData[key] || 0) + 1
    }
  })

  // Convert to array format for easier consumption
  const heatmap = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour <= 22; hour++) {
      const key = `${day}-${hour}`
      heatmap.push({
        day,
        hour,
        value: heatmapData[key] || 0,
        dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day],
        timeLabel: `${hour.toString().padStart(2, '0')}:00`
      })
    }
  }

  return heatmap
}

async function calculateWeeklyTrends(appointments: any[], availability: any[], startDate: Date, endDate: Date) {
  const weeklyData: { [key: string]: { booked: number, total: number } } = {}
  const availableSlotsPerDay = calculateAvailableSlots(availability)

  let currentWeek = startOfWeek(startDate, { weekStartsOn: 1 }) // Monday start
  const lastWeek = endOfWeek(endDate, { weekStartsOn: 1 })

  while (currentWeek <= lastWeek) {
    const weekKey = format(currentWeek, 'yyyy-\'W\'ww')
    weeklyData[weekKey] = { booked: 0, total: availableSlotsPerDay * 7 }
    currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  // Count appointments by week
  appointments.forEach(appointment => {
    if (appointment.status !== 'CANCELLED') {
      const appointmentWeek = startOfWeek(appointment.date, { weekStartsOn: 1 })
      const weekKey = format(appointmentWeek, 'yyyy-\'W\'ww')
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].booked++
      }
    }
  })

  return Object.entries(weeklyData).map(([week, data]) => ({
    week,
    occupancyRate: data.total > 0 ? (data.booked / data.total) * 100 : 0,
    bookedSlots: data.booked,
    totalSlots: data.total
  }))
}

async function analyzeServiceOccupancy(appointments: any[]) {
  const serviceData: { [key: string]: number } = {}
  
  appointments.forEach(appointment => {
    const serviceName = appointment.service?.name || 'Serviço Não Especificado'
    serviceData[serviceName] = (serviceData[serviceName] || 0) + 1
  })

  const totalAppointments = appointments.length

  return Object.entries(serviceData)
    .map(([service, count]) => ({
      service,
      appointments: count,
      percentage: totalAppointments > 0 ? (count / totalAppointments) * 100 : 0
    }))
    .sort((a, b) => b.appointments - a.appointments)
}

async function generateOccupancyRecommendations(data: any, availability: any[]) {
  const recommendations = []
  
  if (data.overview.occupancyRate < 50) {
    recommendations.push({
      type: 'low_occupancy',
      priority: 'high',
      title: 'Taxa de ocupação baixa',
      description: `Sua taxa de ocupação está em ${data.overview.occupancyRate.toFixed(1)}%. Considere estratégias de marketing ou ajustar preços.`,
      actions: [
        'Criar promoções especiais',
        'Aumentar presença nas redes sociais',
        'Oferecer pacotes com desconto',
        'Revisar horários disponíveis'
      ]
    })
  }

  if (data.overview.occupancyRate > 85) {
    recommendations.push({
      type: 'high_demand',
      priority: 'medium',
      title: 'Alta demanda detectada',
      description: `Sua ocupação está em ${data.overview.occupancyRate.toFixed(1)}%. Considere expandir horários ou aumentar preços.`,
      actions: [
        'Adicionar mais horários disponíveis',
        'Considerar aumento de preços',
        'Implementar lista de espera',
        'Avaliar contratação de assistente'
      ]
    })
  }

  // Peak hours recommendations
  if (data.peakHours) {
    const topHours = data.peakHours
      .filter(h => h.appointments > 0)
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 3)

    if (topHours.length > 0) {
      recommendations.push({
        type: 'peak_hours',
        priority: 'low',
        title: 'Horários de pico identificados',
        description: `Seus horários mais ocupados são: ${topHours.map(h => h.timeLabel).join(', ')}.`,
        actions: [
          'Considerar preços diferenciados para horários de pico',
          'Oferecer incentivos para horários menos ocupados',
          'Planejar intervalos adequados nos horários de pico'
        ]
      })
    }
  }

  return recommendations
}