import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/api-auth';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

interface RouteParams {
  params: Promise<{
    role: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { role } = await params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || !userRole || userRole !== role.toUpperCase()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    if (role === 'trainer') {
      return await getTrainerDashboard(userId, {
        now,
        startOfCurrentWeek,
        endOfCurrentWeek,
        startOfCurrentMonth,
        endOfCurrentMonth,
      });
    } else if (role === 'client') {
      return await getClientDashboard(userId, {
        now,
        startOfCurrentWeek,
        endOfCurrentWeek,
        startOfCurrentMonth,
        endOfCurrentMonth,
      });
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    } catch (error) {
      console.error('Dashboard error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }
  });
}

async function getTrainerDashboard(userId: string, dates: any) {
  const { now, startOfCurrentWeek, endOfCurrentWeek, startOfCurrentMonth, endOfCurrentMonth } = dates;

  // Get trainer profile
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  });

  if (!trainerProfile) {
    return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
  }

  // Get stats
  const [
    totalClients,
    thisWeekAppointments,
    thisMonthAppointments,
    todayAppointments,
    recentAppointments,
    weeklyStats,
  ] = await Promise.all([
    // Total active clients
    prisma.clientProfile.count({
      where: {
        trainers: {
          some: {
            id: trainerProfile.id,
          },
        },
      },
    }),

    // This week appointments
    prisma.appointment.findMany({
      where: {
        trainerId: trainerProfile.id,
        date: {
          gte: startOfCurrentWeek,
          lte: endOfCurrentWeek,
        },
        status: { not: 'CANCELLED' },
      },
    }),

    // This month appointments
    prisma.appointment.findMany({
      where: {
        trainerId: trainerProfile.id,
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
        status: 'COMPLETED',
      },
    }),

    // Today's appointments
    prisma.appointment.findMany({
      where: {
        trainerId: trainerProfile.id,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        service: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    }),

    // Recent appointments for activity feed
    prisma.appointment.findMany({
      where: {
        trainerId: trainerProfile.id,
        status: { not: 'CANCELLED' },
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),

    // Weekly occupation stats
    prisma.appointment.groupBy({
      by: ['date'],
      where: {
        trainerId: trainerProfile.id,
        date: {
          gte: startOfCurrentWeek,
          lte: endOfCurrentWeek,
        },
        status: { not: 'CANCELLED' },
      },
      _count: {
        id: true,
      },
    }),
  ]);

  // Calculate revenue
  const thisMonthRevenue = thisMonthAppointments.reduce((sum, apt) => sum + apt.price, 0);

  // Format weekly stats for chart
  const weeklyOccupation = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfCurrentWeek);
    date.setDate(date.getDate() + i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayStats = weeklyStats.find(stat => 
      format(stat.date, 'yyyy-MM-dd') === dateStr
    );
    
    weeklyOccupation.push({
      day: format(date, 'EEE'),
      date: dateStr,
      appointments: dayStats?._count.id || 0,
    });
  }

  return NextResponse.json({
    user: trainerProfile.user,
    profile: trainerProfile,
    stats: {
      totalClients,
      thisWeekAppointments: thisWeekAppointments.length,
      thisMonthRevenue,
      averageRating: trainerProfile.rating,
    },
    todayAppointments,
    recentAppointments,
    weeklyOccupation,
  });
}

async function getClientDashboard(userId: string, dates: any) {
  const { now, startOfCurrentMonth } = dates;

  // Get client profile
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  });

  if (!clientProfile) {
    return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
  }

  // Get stats
  const [
    nextAppointment,
    thisMonthAppointments,
    recentAppointments,
    totalTrainers,
  ] = await Promise.all([
    // Next upcoming appointment
    prisma.appointment.findFirst({
      where: {
        clientId: clientProfile.id,
        startTime: {
          gte: now,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        service: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    }),

    // This month appointments
    prisma.appointment.findMany({
      where: {
        clientId: clientProfile.id,
        date: {
          gte: startOfCurrentMonth,
        },
        status: 'COMPLETED',
      },
    }),

    // Recent appointments for history
    prisma.appointment.findMany({
      where: {
        clientId: clientProfile.id,
        status: 'COMPLETED',
      },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        service: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    }),

    // Total trainers worked with
    prisma.trainerProfile.count({
      where: {
        clients: {
          some: {
            id: clientProfile.id,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    user: clientProfile.user,
    profile: clientProfile,
    stats: {
      thisMonthSessions: thisMonthAppointments.length,
      totalTrainers,
      nextAppointment: nextAppointment ? {
        date: nextAppointment.startTime,
        trainer: nextAppointment.trainer.user.name,
      } : null,
    },
    nextAppointment,
    recentAppointments,
  });
}