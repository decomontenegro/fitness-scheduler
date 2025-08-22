import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    // Await params as required in Next.js 15
    const { role } = await params;
    
    // Get auth token from cookies or header
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('access-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized - No token provided' 
      }, { status: 401 });
    }

    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }
    
    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        trainerProfile: true,
        clientProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check role matches
    const requestedRole = role.toUpperCase();
    if (user.role !== requestedRole) {
      return NextResponse.json({ 
        error: `User is not a ${role}` 
      }, { status: 403 });
    }

    // Get dashboard data based on role
    let dashboardData = {};

    if (role === 'trainer' && user.role === 'TRAINER') {
      // Get trainer-specific data
      const trainerId = user.trainerProfile?.id;
      
      if (!trainerId) {
        return NextResponse.json({ 
          error: 'Trainer profile not found' 
        }, { status: 404 });
      }

      const [appointments, clients, todayAppointments, weekRevenue] = await Promise.all([
        // Total appointments
        prisma.appointment.count({
          where: { trainerId },
        }),
        // Total unique clients
        prisma.appointment.findMany({
          where: { trainerId },
          select: { clientId: true },
          distinct: ['clientId'],
        }),
        // Today's appointments
        prisma.appointment.count({
          where: {
            trainerId,
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        // This week's revenue
        prisma.appointment.aggregate({
          where: {
            trainerId,
            status: 'CONFIRMED',
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
          _sum: {
            price: true,
          },
        }),
      ]);

      // Get recent appointments
      const recentAppointments = await prisma.appointment.findMany({
        where: { trainerId },
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Get today's appointments with details
      const todayDetailedAppointments = await prisma.appointment.findMany({
        where: {
          trainerId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
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
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Calculate weekly occupation (mock data for now)
      const weeklyOccupation = [
        { day: 'Seg', date: '2025-08-12', appointments: 3 },
        { day: 'Ter', date: '2025-08-13', appointments: 5 },
        { day: 'Qua', date: '2025-08-14', appointments: 4 },
        { day: 'Qui', date: '2025-08-15', appointments: 6 },
        { day: 'Sex', date: '2025-08-16', appointments: 2 },
        { day: 'Sáb', date: '2025-08-17', appointments: 0 },
        { day: 'Dom', date: '2025-08-18', appointments: 0 },
      ];

      dashboardData = {
        stats: {
          totalClients: clients.length,
          thisWeekAppointments: appointments,
          thisMonthRevenue: weekRevenue._sum.price || 0,
          averageRating: 4.5, // Mock for now
        },
        todayAppointments: todayDetailedAppointments.map(apt => ({
          id: apt.id,
          startTime: apt.date,
          endTime: new Date(apt.date.getTime() + 60 * 60 * 1000), // Add 1 hour
          status: apt.status,
          client: {
            user: {
              name: apt.client.user.name,
              avatar: apt.client.user.avatar,
            },
          },
          service: {
            name: apt.type || 'Personal Training',
            duration: 60,
            price: apt.price,
          },
        })),
        recentAppointments: recentAppointments.map(apt => ({
          id: apt.id,
          date: apt.date,
          time: apt.startTime || apt.date,
          status: apt.status,
          client: {
            name: apt.client.user.name,
            email: apt.client.user.email,
          },
        })),
        weeklyOccupation,
      };
    } else if (role === 'client' && user.role === 'CLIENT') {
      // Get client-specific data
      const clientId = user.clientProfile?.id;
      
      if (!clientId) {
        return NextResponse.json({ 
          error: 'Client profile not found' 
        }, { status: 404 });
      }

      const [totalSessions, upcomingSessions, totalSpent] = await Promise.all([
        // Total sessions
        prisma.appointment.count({
          where: { clientId },
        }),
        // Upcoming sessions
        prisma.appointment.count({
          where: {
            clientId,
            date: { gte: new Date() },
            status: 'CONFIRMED',
          },
        }),
        // Total spent
        prisma.appointment.aggregate({
          where: {
            clientId,
            status: 'CONFIRMED',
          },
          _sum: {
            price: true,
          },
        }),
      ]);

      // Get recent appointments
      const recentAppointments = await prisma.appointment.findMany({
        where: { clientId },
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          trainer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      dashboardData = {
        stats: {
          totalSessions,
          upcomingSessions,
          totalSpent: totalSpent._sum.price || 0,
        },
        recentAppointments: recentAppointments.map(apt => ({
          id: apt.id,
          date: apt.date,
          time: apt.startTime || apt.date,
          status: apt.status,
          trainer: {
            name: apt.trainer.user.name,
            email: apt.trainer.user.email,
          },
        })),
      };
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...dashboardData,
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}