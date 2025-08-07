import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { subMonths } from 'date-fns'

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

    // Get client progress records
    const progress = await prisma.clientProgress.findMany({
      where: {
        clientId: user.clientProfile.id,
        recordDate: {
          gte: startDate
        }
      },
      orderBy: {
        recordDate: 'asc'
      }
    })

    // Calculate progress summary
    const summary = calculateProgressSummary(progress)

    return NextResponse.json({
      progress,
      summary,
      period: {
        start: startDate,
        end: new Date(),
        months
      }
    })

  } catch (error) {
    console.error('Erro ao buscar progresso do cliente:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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
      weight,
      bodyFat,
      muscleMass,
      measurements,
      currentGoals,
      achievedGoals,
      notes
    } = await request.json()

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        clientProfile: true
      }
    })

    if (!user || !user.clientProfile) {
      return NextResponse.json({ error: 'Perfil de cliente não encontrado' }, { status: 404 })
    }

    // Create new progress record
    const progressRecord = await prisma.clientProgress.create({
      data: {
        clientId: user.clientProfile.id,
        weight: weight ? parseFloat(weight) : null,
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        muscleMass: muscleMass ? parseFloat(muscleMass) : null,
        measurements: measurements || null,
        currentGoals: currentGoals || null,
        achievedGoals: achievedGoals || null,
        notes: notes || null,
        recordDate: new Date()
      }
    })

    return NextResponse.json({
      message: 'Progresso registrado com sucesso',
      progress: progressRecord
    })

  } catch (error) {
    console.error('Erro ao registrar progresso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function calculateProgressSummary(progress: any[]) {
  if (progress.length === 0) {
    return {
      totalRecords: 0,
      weightChange: 0,
      bodyFatChange: 0,
      muscleMassChange: 0,
      currentGoalsCount: 0,
      achievedGoalsCount: 0
    }
  }

  const first = progress[0]
  const latest = progress[progress.length - 1]

  return {
    totalRecords: progress.length,
    weightChange: (latest.weight || 0) - (first.weight || 0),
    bodyFatChange: (latest.bodyFat || 0) - (first.bodyFat || 0),
    muscleMassChange: (latest.muscleMass || 0) - (first.muscleMass || 0),
    currentGoalsCount: latest.currentGoals ? latest.currentGoals.length : 0,
    achievedGoalsCount: latest.achievedGoals ? latest.achievedGoals.length : 0,
    latestRecord: latest,
    firstRecord: first
  }
}