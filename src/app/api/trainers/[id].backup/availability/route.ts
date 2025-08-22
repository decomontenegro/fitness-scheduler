import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

const availabilitySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isActive: z.boolean().default(true),
});

const bulkAvailabilitySchema = z.array(availabilitySchema);

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD

    // Verify trainer exists
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            isActive: true,
            name: true,
          },
        },
      },
    });

    if (!trainer || !trainer.user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Trainer not found or inactive' },
        { status: 404 }
      );
    }

    // Get availability
    const availability = await prisma.availability.findMany({
      where: {
        trainerId: id,
        isActive: true,
      },
      orderBy: [
        {
          dayOfWeek: 'asc',
        },
        {
          startTime: 'asc',
        },
      ],
    });

    // If date is provided, check booked slots for that date
    let bookedSlots: any[] = [];
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      bookedSlots = await prisma.appointment.findMany({
        where: {
          trainerId: id,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });
    }

    // Generate available time slots function
    const generateTimeSlots = (availability: any[], bookedSlots: any[], targetDate?: string) => {
      if (!targetDate) return [];

      const date = new Date(targetDate);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      
      // Find availability for this day of week
      const dayAvailability = availability.filter(a => 
        a.dayOfWeek.toUpperCase() === dayOfWeek
      );

      const slots: any[] = [];

      dayAvailability.forEach(avail => {
        const startHour = parseInt(avail.startTime.split(':')[0]);
        const startMinute = parseInt(avail.startTime.split(':')[1]);
        const endHour = parseInt(avail.endTime.split(':')[0]);
        const endMinute = parseInt(avail.endTime.split(':')[1]);

        // Generate 1-hour slots
        for (let hour = startHour; hour < endHour; hour++) {
          let slotStart: Date;
          let slotEnd: Date;

          if (hour === startHour) {
            slotStart = new Date(targetDate + `T${String(hour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00.000Z`);
          } else {
            slotStart = new Date(targetDate + `T${String(hour).padStart(2, '0')}:00:00.000Z`);
          }

          if (hour === endHour - 1 && endMinute < 60) {
            slotEnd = new Date(targetDate + `T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00.000Z`);
          } else {
            slotEnd = new Date(targetDate + `T${String(hour + 1).padStart(2, '0')}:00:00.000Z`);
          }

          // Check if slot is booked
          const isBooked = bookedSlots.some(booking => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            
            return (
              (slotStart >= bookingStart && slotStart < bookingEnd) ||
              (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
              (slotStart <= bookingStart && slotEnd >= bookingEnd)
            );
          });

          // Check if slot is in the past
          const now = new Date();
          const isPast = slotStart <= now;

          if (!isBooked && !isPast) {
            const displayStart = `${String(hour).padStart(2, '0')}:${String(hour === startHour ? startMinute : 0).padStart(2, '0')}`;
            const displayEndHour = hour + 1 <= endHour ? hour + 1 : endHour;
            const displayEndMinute = hour + 1 <= endHour ? 0 : endMinute;
            const displayEnd = `${String(displayEndHour).padStart(2, '0')}:${String(displayEndMinute).padStart(2, '0')}`;
            
            slots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              display: `${displayStart} - ${displayEnd}`,
              available: true,
            });
          }
        }
      });

      return slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    };

    const availableSlots = date ? generateTimeSlots(availability, bookedSlots, date) : [];

    return NextResponse.json({
      success: true,
      data: {
        trainerId: id,
        trainerName: trainer.user.name,
        availability: availability.map(a => ({
          id: a.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isActive: a.isActive,
        })),
        availableSlots: availableSlots,
        requestedDate: date,
      },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || userRole !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify trainer owns this profile
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { id: params.id },
    });

    if (!trainerProfile || trainerProfile.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Check if it's a single availability or bulk
    const isBulk = Array.isArray(body);
    
    if (isBulk) {
      const validatedData = bulkAvailabilitySchema.parse(body);
      
      // Delete existing availability for this trainer
      await prisma.availability.deleteMany({
        where: { trainerId: params.id },
      });
      
      // Create new availability slots
      const availabilitySlots = await prisma.availability.createMany({
        data: validatedData.map(slot => ({
          ...slot,
          trainerId: params.id,
        })),
      });

      return NextResponse.json({
        success: true,
        message: `${availabilitySlots.count} availability slots created`,
      }, { status: 201 });
    } else {
      const validatedData = availabilitySchema.parse(body);
      
      // Check for overlapping slots
      const overlapping = await prisma.availability.findFirst({
        where: {
          trainerId: params.id,
          dayOfWeek: validatedData.dayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lte: validatedData.startTime } },
                { endTime: { gt: validatedData.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: validatedData.endTime } },
                { endTime: { gte: validatedData.endTime } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json(
          { error: 'Time slot overlaps with existing availability' },
          { status: 409 }
        );
      }

      const availability = await prisma.availability.create({
        data: {
          ...validatedData,
          trainerId: params.id,
        },
      });

      return NextResponse.json({
        success: true,
        data: availability,
      }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create availability error:', error);
    return NextResponse.json(
      { error: 'Failed to create availability' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || userRole !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const availabilityId = searchParams.get('availabilityId');
    
    if (!availabilityId) {
      return NextResponse.json({ error: 'Availability ID required' }, { status: 400 });
    }

    // Verify trainer owns this availability
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: { trainer: true },
    });

    if (!availability || availability.trainer.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = availabilitySchema.parse(body);

    const updatedAvailability = await prisma.availability.update({
      where: { id: availabilityId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedAvailability,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update availability error:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || userRole !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const availabilityId = searchParams.get('availabilityId');
    
    if (!availabilityId) {
      // Delete all availability for this trainer
      const trainerProfile = await prisma.trainerProfile.findUnique({
        where: { id: params.id },
      });

      if (!trainerProfile || trainerProfile.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.availability.deleteMany({
        where: { trainerId: params.id },
      });

      return NextResponse.json({
        success: true,
        message: 'All availability slots deleted',
      });
    } else {
      // Delete specific availability
      const availability = await prisma.availability.findUnique({
        where: { id: availabilityId },
        include: { trainer: true },
      });

      if (!availability || availability.trainer.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.availability.delete({
        where: { id: availabilityId },
      });

      return NextResponse.json({
        success: true,
        message: 'Availability slot deleted',
      });
    }
  } catch (error) {
    console.error('Delete availability error:', error);
    return NextResponse.json(
      { error: 'Failed to delete availability' },
      { status: 500 }
    );
  }
}