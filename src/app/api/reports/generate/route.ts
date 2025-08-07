import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { format, subDays, subMonths } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { 
      reportType, 
      format: outputFormat, 
      period, 
      filters,
      includeCharts = false 
    } = await request.json()

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
    const endDate = new Date()
    let startDate: Date

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
      case '1y':
        startDate = subMonths(endDate, 12)
        break
      default:
        startDate = subDays(endDate, 30)
    }

    let reportData
    let filename

    switch (reportType) {
      case 'financial':
        reportData = await generateFinancialReport(user, startDate, endDate, filters)
        filename = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}`
        break
      case 'clients':
        reportData = await generateClientsReport(user, startDate, endDate, filters)
        filename = `relatorio-clientes-${format(new Date(), 'yyyy-MM-dd')}`
        break
      case 'occupancy':
        reportData = await generateOccupancyReport(user, startDate, endDate, filters)
        filename = `relatorio-ocupacao-${format(new Date(), 'yyyy-MM-dd')}`
        break
      case 'performance':
        reportData = await generatePerformanceReport(user, startDate, endDate, filters)
        filename = `relatorio-desempenho-${format(new Date(), 'yyyy-MM-dd')}`
        break
      default:
        return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 })
    }

    let buffer: Buffer
    let contentType: string

    if (outputFormat === 'pdf') {
      buffer = await generatePDFReport(reportData, reportType, includeCharts)
      contentType = 'application/pdf'
      filename += '.pdf'
    } else {
      buffer = await generateExcelReport(reportData, reportType)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename += '.xlsx'
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function generateFinancialReport(user: any, startDate: Date, endDate: Date, filters: any) {
  const trainerId = user.trainerProfile?.id || filters?.trainerId

  const whereCondition: any = {
    status: 'succeeded',
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  if (trainerId && user.role === 'TRAINER') {
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const summary = {
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    trainerRevenue: payments.reduce((sum, p) => sum + (p.trainerAmount || 0), 0),
    platformRevenue: payments.reduce((sum, p) => sum + (p.platformAmount || 0), 0),
    transactionCount: payments.length,
    averageTicket: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0
  }

  // Group by payment method
  const paymentMethods = payments.reduce((acc: any, payment) => {
    const method = payment.method || 'Não Especificado'
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 }
    }
    acc[method].count++
    acc[method].amount += payment.amount
    return acc
  }, {})

  // Group by service
  const services = payments.reduce((acc: any, payment) => {
    const serviceName = payment.appointment?.service?.name || 
                       payment.subscription?.plan?.name ||
                       payment.package?.name ||
                       'Serviço Não Especificado'
    if (!acc[serviceName]) {
      acc[serviceName] = { count: 0, amount: 0 }
    }
    acc[serviceName].count++
    acc[serviceName].amount += payment.amount
    return acc
  }, {})

  return {
    title: 'Relatório Financeiro',
    period: { start: startDate, end: endDate },
    summary,
    transactions: payments.map(p => ({
      date: p.createdAt,
      amount: p.amount,
      method: p.method,
      status: p.status,
      client: p.appointment?.client?.user?.name || 'N/A',
      service: p.appointment?.service?.name || p.subscription?.plan?.name || p.package?.name || 'N/A',
      trainer: p.appointment?.trainer?.user?.name || 'N/A'
    })),
    paymentMethods,
    services
  }
}

async function generateClientsReport(user: any, startDate: Date, endDate: Date, filters: any) {
  const trainerId = user.trainerProfile?.id || filters?.trainerId

  const whereCondition: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  if (trainerId) {
    whereCondition.trainers = {
      some: {
        id: trainerId
      }
    }
  }

  const clients = await prisma.clientProfile.findMany({
    where: whereCondition,
    include: {
      user: true,
      appointments: {
        include: {
          service: true,
          payment: true
        }
      },
      reviews: true,
      progress: {
        orderBy: {
          recordDate: 'desc'
        },
        take: 1
      }
    }
  })

  const summary = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.appointments.some(a => a.date >= subDays(new Date(), 30))).length,
    newClients: clients.length,
    averageSessionsPerClient: clients.length > 0 ? 
      clients.reduce((sum, c) => sum + c.appointments.length, 0) / clients.length : 0
  }

  return {
    title: 'Relatório de Clientes',
    period: { start: startDate, end: endDate },
    summary,
    clients: clients.map(c => ({
      name: c.user.name,
      email: c.user.email,
      phone: c.user.phone,
      joinDate: c.createdAt,
      totalSessions: c.appointments.length,
      totalSpent: c.appointments.reduce((sum, a) => sum + (a.payment?.amount || 0), 0),
      lastSession: c.appointments.length > 0 ? 
        Math.max(...c.appointments.map(a => a.date.getTime())) : null,
      averageRating: c.reviews.length > 0 ? 
        c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length : null,
      goals: c.goals,
      lastProgress: c.progress[0] || null
    }))
  }
}

async function generateOccupancyReport(user: any, startDate: Date, endDate: Date, filters: any) {
  const trainerId = user.trainerProfile?.id || filters?.trainerId

  if (!trainerId) {
    throw new Error('Trainer ID é necessário para relatório de ocupação')
  }

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

  const availability = await prisma.availability.findMany({
    where: {
      trainerId,
      isActive: true
    }
  })

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const slotsPerDay = availability.reduce((sum, av) => {
    const [startHour] = av.startTime.split(':').map(Number)
    const [endHour] = av.endTime.split(':').map(Number)
    return sum + (endHour - startHour)
  }, 0)
  
  const totalSlots = totalDays * slotsPerDay
  const bookedSlots = appointments.filter(a => a.status !== 'CANCELLED').length

  const summary = {
    occupancyRate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0,
    totalSlots,
    bookedSlots,
    availableSlots: totalSlots - bookedSlots,
    cancelledAppointments: appointments.filter(a => a.status === 'CANCELLED').length
  }

  // Group by day of week
  const dayOfWeek = appointments.reduce((acc: any, appointment) => {
    const dayName = appointment.date.toLocaleDateString('pt-BR', { weekday: 'long' })
    if (!acc[dayName]) {
      acc[dayName] = 0
    }
    if (appointment.status !== 'CANCELLED') {
      acc[dayName]++
    }
    return acc
  }, {})

  // Group by time
  const timeSlots = appointments.reduce((acc: any, appointment) => {
    if (appointment.status !== 'CANCELLED') {
      const hour = appointment.startTime.getHours()
      if (!acc[hour]) {
        acc[hour] = 0
      }
      acc[hour]++
    }
    return acc
  }, {})

  return {
    title: 'Relatório de Ocupação',
    period: { start: startDate, end: endDate },
    summary,
    appointments: appointments.map(a => ({
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      client: a.client.user.name,
      service: a.service?.name || 'N/A',
      status: a.status,
      price: a.price
    })),
    dayOfWeekStats: dayOfWeek,
    timeSlotStats: timeSlots,
    availability: availability.map(av => ({
      dayOfWeek: av.dayOfWeek,
      startTime: av.startTime,
      endTime: av.endTime
    }))
  }
}

async function generatePerformanceReport(user: any, startDate: Date, endDate: Date, filters: any) {
  const trainerId = user.trainerProfile?.id || filters?.trainerId

  if (!trainerId) {
    throw new Error('Trainer ID é necessário para relatório de desempenho')
  }

  const reviews = await prisma.review.findMany({
    where: {
      trainerId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      client: {
        include: {
          user: true
        }
      },
      appointment: {
        include: {
          service: true
        }
      }
    }
  })

  const appointments = await prisma.appointment.findMany({
    where: {
      trainerId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const averageRating = reviews.length > 0 ? 
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  }

  // Calculate NPS
  const promoters = reviews.filter(r => r.rating >= 4).length
  const detractors = reviews.filter(r => r.rating <= 2).length
  const nps = reviews.length > 0 ? ((promoters - detractors) / reviews.length) * 100 : 0

  const summary = {
    averageRating,
    totalReviews: reviews.length,
    nps,
    totalAppointments: appointments.length,
    cancelledAppointments: appointments.filter(a => a.status === 'CANCELLED').length,
    cancelRate: appointments.length > 0 ? 
      (appointments.filter(a => a.status === 'CANCELLED').length / appointments.length) * 100 : 0
  }

  return {
    title: 'Relatório de Desempenho',
    period: { start: startDate, end: endDate },
    summary,
    ratingDistribution,
    reviews: reviews.map(r => ({
      date: r.createdAt,
      rating: r.rating,
      comment: r.comment,
      client: r.client.user.name,
      service: r.appointment.service?.name || 'N/A'
    }))
  }
}

async function generatePDFReport(reportData: any, reportType: string, includeCharts: boolean): Promise<Buffer> {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text(reportData.title, 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Período: ${format(reportData.period.start, 'dd/MM/yyyy')} até ${format(reportData.period.end, 'dd/MM/yyyy')}`, 20, 35)
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45)
  
  let yPosition = 60

  // Summary section
  doc.setFontSize(16)
  doc.text('Resumo', 20, yPosition)
  yPosition += 15

  doc.setFontSize(10)
  Object.entries(reportData.summary).forEach(([key, value]) => {
    const label = formatLabel(key)
    const formattedValue = formatValue(key, value as number)
    doc.text(`${label}: ${formattedValue}`, 20, yPosition)
    yPosition += 8
  })

  // Data tables (simplified for space)
  yPosition += 10
  doc.setFontSize(16)
  doc.text('Detalhes', 20, yPosition)
  yPosition += 15

  // Add first few rows of data
  if (reportData.transactions && reportData.transactions.length > 0) {
    doc.setFontSize(8)
    reportData.transactions.slice(0, 20).forEach((transaction: any, index: number) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      const text = `${format(transaction.date, 'dd/MM')} - ${transaction.client} - R$ ${transaction.amount.toFixed(2)}`
      doc.text(text, 20, yPosition)
      yPosition += 6
    })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

async function generateExcelReport(reportData: any, reportType: string): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
    Métrica: formatLabel(key),
    Valor: formatValue(key, value as number)
  }))
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')

  // Data sheets based on report type
  if (reportData.transactions) {
    const transactionSheet = XLSX.utils.json_to_sheet(
      reportData.transactions.map((t: any) => ({
        Data: format(t.date, 'dd/MM/yyyy'),
        Cliente: t.client,
        Serviço: t.service,
        Trainer: t.trainer,
        Valor: t.amount,
        Método: t.method,
        Status: t.status
      }))
    )
    XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transações')
  }

  if (reportData.clients) {
    const clientSheet = XLSX.utils.json_to_sheet(
      reportData.clients.map((c: any) => ({
        Nome: c.name,
        Email: c.email,
        Telefone: c.phone,
        'Data Cadastro': format(c.joinDate, 'dd/MM/yyyy'),
        'Total Sessões': c.totalSessions,
        'Total Gasto': c.totalSpent,
        'Última Sessão': c.lastSession ? format(new Date(c.lastSession), 'dd/MM/yyyy') : 'N/A',
        'Avaliação Média': c.averageRating?.toFixed(1) || 'N/A'
      }))
    )
    XLSX.utils.book_append_sheet(workbook, clientSheet, 'Clientes')
  }

  if (reportData.appointments) {
    const appointmentSheet = XLSX.utils.json_to_sheet(
      reportData.appointments.map((a: any) => ({
        Data: format(a.date, 'dd/MM/yyyy'),
        'Hora Início': format(a.startTime, 'HH:mm'),
        'Hora Fim': format(a.endTime, 'HH:mm'),
        Cliente: a.client,
        Serviço: a.service,
        Status: a.status,
        Valor: a.price
      }))
    )
    XLSX.utils.book_append_sheet(workbook, appointmentSheet, 'Agendamentos')
  }

  if (reportData.reviews) {
    const reviewSheet = XLSX.utils.json_to_sheet(
      reportData.reviews.map((r: any) => ({
        Data: format(r.date, 'dd/MM/yyyy'),
        Cliente: r.client,
        Serviço: r.service,
        Avaliação: r.rating,
        Comentário: r.comment || ''
      }))
    )
    XLSX.utils.book_append_sheet(workbook, reviewSheet, 'Avaliações')
  }

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

function formatLabel(key: string): string {
  const labels: { [key: string]: string } = {
    totalRevenue: 'Receita Total',
    trainerRevenue: 'Receita do Trainer',
    platformRevenue: 'Receita da Plataforma',
    transactionCount: 'Número de Transações',
    averageTicket: 'Ticket Médio',
    totalClients: 'Total de Clientes',
    activeClients: 'Clientes Ativos',
    newClients: 'Novos Clientes',
    averageSessionsPerClient: 'Sessões Médias por Cliente',
    occupancyRate: 'Taxa de Ocupação (%)',
    totalSlots: 'Total de Slots',
    bookedSlots: 'Slots Reservados',
    availableSlots: 'Slots Disponíveis',
    cancelledAppointments: 'Agendamentos Cancelados',
    averageRating: 'Avaliação Média',
    totalReviews: 'Total de Avaliações',
    nps: 'NPS',
    totalAppointments: 'Total de Agendamentos',
    cancelRate: 'Taxa de Cancelamento (%)'
  }
  
  return labels[key] || key
}

function formatValue(key: string, value: number): string {
  if (key.includes('Revenue') || key.includes('revenue') || key.includes('Spent') || key === 'averageTicket') {
    return `R$ ${value.toFixed(2)}`
  }
  
  if (key.includes('Rate') || key.includes('rate') || key === 'nps') {
    return `${value.toFixed(1)}%`
  }
  
  if (key === 'averageRating') {
    return value.toFixed(1)
  }
  
  return value.toString()
}