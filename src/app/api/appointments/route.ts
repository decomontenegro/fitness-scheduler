import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createAppointmentSchema = z.object({
  trainerId: z.string().min(1),
  clientId: z.string().min(1),
  serviceId: z.string().optional(),
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
  price: z.number().min(0),
});

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('access-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized - No token provided' 
      }, { status: 401 });
    }

    // Import verifyToken
    const { verifyToken } = await import('@/lib/auth');
    
    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    const userId = payload.userId;
    
    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userRole = user.role;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '10');

    let where: any = {};

    // Filter by user role
    if (userRole === 'TRAINER') {
      // Get trainer profile ID
      const trainerProfile = await prisma.trainerProfile.findUnique({
        where: { userId },
      });
      if (!trainerProfile) {
        return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
      }
      where.trainerId = trainerProfile.id;
    } else if (userRole === 'CLIENT') {
      // Get client profile ID
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId },
      });
      if (!clientProfile) {
        return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
      }
      where.clientId = clientProfile.id;
    }

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        service: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: limit,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('access-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized - No token provided' 
      }, { status: 401 });
    }

    // Import verifyToken
    const { verifyToken } = await import('@/lib/auth');
    
    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    const userId = payload.userId;
    
    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userRole = user.role;

    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

    // Check if user can create appointment
    if (userRole === 'CLIENT') {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId },
      });
      if (!clientProfile || validatedData.clientId !== clientProfile.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (userRole === 'TRAINER') {
      const trainerProfile = await prisma.trainerProfile.findUnique({
        where: { userId },
      });
      if (!trainerProfile || validatedData.trainerId !== trainerProfile.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        trainerId: validatedData.trainerId,
        date: new Date(validatedData.date),
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(validatedData.startTime) } },
              { endTime: { gt: new Date(validatedData.startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(validatedData.endTime) } },
              { endTime: { gte: new Date(validatedData.endTime) } },
            ],
          },
        ],
        status: { not: 'CANCELLED' },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Time slot is already booked' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        status: 'PENDING',
      },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        service: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}