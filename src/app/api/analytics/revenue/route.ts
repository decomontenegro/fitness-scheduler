import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { subDays, subMonths, startOfMonth, endOfMonth, format, parseISO } from 'date-fns'

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
    const period = searchParams.get('period') || '12m'
    const trainerId = searchParams.get('trainerId')
    const comparison = searchParams.get('comparison') || 'previous_period'

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        trainerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

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

    const targetTrainerId = trainerId || user.trainerProfile?.id

    // Get revenue data
    const revenueData = await getRevenueAnalysis(targetTrainerId, startDate, endDate, user.role)

    // Get comparison data if requested
    let comparisonData = null
    if (comparison === 'previous_period') {
      const comparisonStartDate = subMonths(startDate, months)
      const comparisonEndDate = startDate
      comparisonData = await getRevenueAnalysis(targetTrainerId, comparisonStartDate, comparisonEndDate, user.role)
    } else if (comparison === 'year_over_year') {
      const comparisonStartDate = subMonths(startDate, 12)
      const comparisonEndDate = subMonths(endDate, 12)
      comparisonData = await getRevenueAnalysis(targetTrainerId, comparisonStartDate, comparisonEndDate, user.role)
    }

    return NextResponse.json({
      current: revenueData,
      comparison: comparisonData,
      period: {
        start: startDate,
        end: endDate,
        months
      }
    })
  } catch (error) {
    console.error('Erro ao buscar análise de receita:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function getRevenueAnalysis(trainerId: string | undefined, startDate: Date, endDate: Date, userRole: string) {
  const whereCondition: any = {
    status: 'succeeded',
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  // If user is a trainer, filter by their ID
  if (trainerId && userRole === 'TRAINER') {
    whereCondition.appointment = {
      trainerId: trainerId
    }
  }

  const payments = await prisma.payment.findMany({
    where: whereCondition,
    include: {
      appointment: {
        include: {
          trainer: {
            include: {
              user: true
            }
          },
          client: {
            include: {
              user: true
            }
          },
          service: true
        }
      },
      subscription: {
        include: {
          plan: true
        }
      },
      package: true
    }
  })

  // Calculate metrics
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const trainerRevenue = payments.reduce((sum, payment) => sum + (payment.trainerAmount || 0), 0)
  const platformRevenue = totalRevenue - trainerRevenue
  const averageTransactionValue = payments.length > 0 ? totalRevenue / payments.length : 0

  // Revenue by month
  const revenueByMonth = await groupRevenueByMonth(payments, startDate, endDate)

  // Revenue by service type
  const revenueByService = await groupRevenueByService(payments)

  // Revenue by trainer (for admin view)
  const revenueByTrainer = userRole === 'ADMIN' ? await groupRevenueByTrainer(payments) : []

  // Payment method breakdown
  const paymentMethodBreakdown = await groupByPaymentMethod(payments)

  // Revenue forecast (simple linear regression)
  const forecast = await calculateRevenueForecast(revenueByMonth)

  // Top performing services
  const topServices = revenueByService
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    summary: {
      totalRevenue,
      trainerRevenue,
      platformRevenue,
      transactionCount: payments.length,
      averageTransactionValue
    },
    trends: {
      revenueByMonth,
      forecast
    },
    breakdown: {
      byService: revenueByService,
      byTrainer: revenueByTrainer,
      byPaymentMethod: paymentMethodBreakdown
    },
    insights: {
      topServices,
      growthRate: await calculateGrowthRate(revenueByMonth),
      seasonality: await analyzeSeasonality(revenueByMonth)
    }
  }
}

async function groupRevenueByMonth(payments: any[], startDate: Date, endDate: Date) {
  const months: { [key: string]: { revenue: number, transactions: number } } = {}
  
  // Initialize all months in range with 0
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  
  while (currentMonth <= endMonth) {
    const key = format(currentMonth, 'yyyy-MM')
    months[key] = { revenue: 0, transactions: 0 }
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
  }

  // Populate with actual data
  payments.forEach(payment => {
    const key = format(payment.createdAt, 'yyyy-MM')
    if (months[key]) {
      months[key].revenue += payment.amount
      months[key].transactions += 1
    }
  })

  return Object.entries(months).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    transactions: data.transactions,
    averageTicket: data.transactions > 0 ? data.revenue / data.transactions : 0
  }))
}

async function groupRevenueByService(payments: any[]) {
  const services: { [key: string]: { revenue: number, count: number } } = {}
  
  payments.forEach(payment => {
    const serviceName = payment.appointment?.service?.name || 
                       payment.subscription?.plan?.name ||
                       payment.package?.name ||
                       'Serviço Não Especificado'
    
    if (!services[serviceName]) {
      services[serviceName] = { revenue: 0, count: 0 }
    }
    
    services[serviceName].revenue += payment.amount
    services[serviceName].count += 1
  })

  return Object.entries(services).map(([service, data]) => ({
    service,
    revenue: data.revenue,
    transactions: data.count,
    averageTicket: data.revenue / data.count
  }))
}

async function groupRevenueByTrainer(payments: any[]) {
  const trainers: { [key: string]: { revenue: number, trainerRevenue: number, count: number, name: string } } = {}
  
  payments.forEach(payment => {
    if (payment.appointment?.trainer) {
      const trainerId = payment.appointment.trainer.id
      const trainerName = payment.appointment.trainer.user.name
      
      if (!trainers[trainerId]) {
        trainers[trainerId] = { revenue: 0, trainerRevenue: 0, count: 0, name: trainerName }
      }
      
      trainers[trainerId].revenue += payment.amount
      trainers[trainerId].trainerRevenue += payment.trainerAmount || 0
      trainers[trainerId].count += 1
    }
  })

  return Object.entries(trainers).map(([trainerId, data]) => ({
    trainerId,
    trainerName: data.name,
    totalRevenue: data.revenue,
    trainerRevenue: data.trainerRevenue,
    platformRevenue: data.revenue - data.trainerRevenue,
    transactions: data.count,
    averageTicket: data.revenue / data.count
  }))
}

async function groupByPaymentMethod(payments: any[]) {
  const methods: { [key: string]: { revenue: number, count: number } } = {}
  
  payments.forEach(payment => {
    const method = payment.method || 'Não Especificado'
    
    if (!methods[method]) {
      methods[method] = { revenue: 0, count: 0 }
    }
    
    methods[method].revenue += payment.amount
    methods[method].count += 1
  })

  return Object.entries(methods).map(([method, data]) => ({
    method,
    revenue: data.revenue,
    transactions: data.count,
    percentage: 0 // Will be calculated on frontend
  }))
}

async function calculateGrowthRate(monthlyData: any[]) {
  if (monthlyData.length < 2) return 0

  const recent = monthlyData.slice(-3).reduce((sum, month) => sum + month.revenue, 0) / 3
  const previous = monthlyData.slice(-6, -3).reduce((sum, month) => sum + month.revenue, 0) / 3

  return previous > 0 ? ((recent - previous) / previous) * 100 : 0
}

async function analyzeSeasonality(monthlyData: any[]) {
  if (monthlyData.length < 12) return null

  const monthlyAverages: { [key: number]: number } = {}
  
  monthlyData.forEach(data => {
    const monthNum = parseInt(data.month.split('-')[1])
    if (!monthlyAverages[monthNum]) {
      monthlyAverages[monthNum] = 0
    }
    monthlyAverages[monthNum] += data.revenue
  })

  // Calculate averages
  Object.keys(monthlyAverages).forEach(month => {
    const monthKey = parseInt(month)
    const occurrences = monthlyData.filter(data => 
      parseInt(data.month.split('-')[1]) === monthKey
    ).length
    monthlyAverages[monthKey] = monthlyAverages[monthKey] / occurrences
  })

  const overallAverage = Object.values(monthlyAverages).reduce((sum, val) => sum + val, 0) / 12

  return Object.entries(monthlyAverages).map(([month, average]) => ({
    month: parseInt(month),
    monthName: new Date(2024, parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'long' }),
    average,
    index: average / overallAverage // Seasonality index
  })).sort((a, b) => a.month - b.month)
}

async function calculateRevenueForecast(monthlyData: any[]) {
  if (monthlyData.length < 3) return []

  // Simple linear regression for next 3 months
  const recentData = monthlyData.slice(-6)
  const xValues = recentData.map((_, index) => index)
  const yValues = recentData.map(data => data.revenue)

  // Calculate linear regression
  const n = recentData.length
  const sumX = xValues.reduce((sum, x) => sum + x, 0)
  const sumY = yValues.reduce((sum, y) => sum + y, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate forecasts for next 3 months
  const lastMonth = new Date(recentData[recentData.length - 1].month + '-01')
  const forecast = []

  for (let i = 1; i <= 3; i++) {
    const forecastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1)
    const x = recentData.length + i - 1
    const predictedRevenue = Math.max(0, slope * x + intercept)

    forecast.push({
      month: format(forecastMonth, 'yyyy-MM'),
      predictedRevenue,
      confidence: Math.max(0, 100 - (i * 10)) // Decreasing confidence
    })
  }

  return forecast
}