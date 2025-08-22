import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

interface BookingData {
  trainerId: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('access-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    // For testing, allow booking without authentication
    let userId: string | null = null;
    let clientId: string | null = null;

    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
        
        // Get client profile
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { clientProfile: true }
        });

        if (user?.clientProfile) {
          clientId = user.clientProfile.id;
        }
      } catch (error) {
        console.log('Token verification failed, continuing as guest');
      }
    }

    const body: BookingData = await request.json();
    const { trainerId, serviceId, date, timeSlot, notes } = body;

    // Validate required fields
    if (!trainerId || !serviceId || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse time slot (format: "HH:MM")
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const bookingDate = new Date(date);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    const startTime = new Date(bookingDate);
    const endTime = new Date(bookingDate);
    endTime.setHours(endTime.getHours() + 1); // Default 1 hour duration

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // If service has duration, use it
    if (service.duration) {
      endTime.setTime(startTime.getTime() + service.duration * 60 * 1000);
    }

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        trainerId,
        date: bookingDate,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
        status: { not: 'CANCELLED' },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Create or get test client if not authenticated
    if (!clientId) {
      // For testing, create a guest client
      const testUser = await prisma.user.upsert({
        where: { email: 'guest@test.com' },
        update: {},
        create: {
          email: 'guest@test.com',
          name: 'Guest User',
          password: 'not-used',
          role: 'CLIENT',
        },
      });

      const testClient = await prisma.clientProfile.upsert({
        where: { userId: testUser.id },
        update: {},
        create: {
          userId: testUser.id,
          goals: 'Testing booking system',
        },
      });

      clientId = testClient.id;
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        trainerId,
        clientId,
        serviceId,
        date: bookingDate,
        startTime,
        endTime,
        status: 'PENDING',
        notes,
        price: service.price,
        isPaid: false,
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
              },
            },
          },
        },
        service: true,
      },
    });

    // TODO: Send confirmation email
    // TODO: Send notification to trainer
    // TODO: Create payment if required

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: {
        id: appointment.id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        service: appointment.service,
        trainer: {
          name: appointment.trainer.user.name,
          email: appointment.trainer.user.email,
        },
        client: {
          name: appointment.client.user.name,
          email: appointment.client.user.email,
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}