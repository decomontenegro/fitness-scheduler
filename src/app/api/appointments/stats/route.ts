import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('access-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    // For testing, allow stats without authentication but with limited data
    let userId: string | null = null;
    let userRole: string | null = null;

    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
        
        // Get user role
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        
        userRole = user?.role || null;
      } catch (error) {
        console.log('Token verification failed, returning default stats');
      }
    }

    // Default stats
    let stats = {
      total: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    };

    if (userId && userRole) {
      const now = new Date();
      let where: any = {};

      // Filter by user role
      if (userRole === 'TRAINER') {
        const trainerProfile = await prisma.trainerProfile.findUnique({
          where: { userId },
        });
        if (trainerProfile) {
          where.trainerId = trainerProfile.id;
        }
      } else if (userRole === 'CLIENT') {
        const clientProfile = await prisma.clientProfile.findUnique({
          where: { userId },
        });
        if (clientProfile) {
          where.clientId = clientProfile.id;
        }
      }

      // Get total appointments
      const total = await prisma.appointment.count({ where });

      // Get upcoming appointments
      const upcoming = await prisma.appointment.count({
        where: {
          ...where,
          date: { gte: now },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      // Get completed appointments
      const completed = await prisma.appointment.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      });

      // Get cancelled appointments
      const cancelled = await prisma.appointment.count({
        where: {
          ...where,
          status: 'CANCELLED',
        },
      });

      stats = {
        total,
        upcoming,
        completed,
        cancelled,
      };
    }

    return NextResponse.json({ 
      success: true,
      stats 
    });
    
  } catch (error) {
    console.error('Get appointment stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointment stats',
        stats: {
          total: 0,
          upcoming: 0,
          completed: 0,
          cancelled: 0,
        }
      },
      { status: 500 }
    );
  }
}