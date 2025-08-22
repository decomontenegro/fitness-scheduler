import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, format, parseISO, addDays } from 'date-fns';

// GET /api/trainers/[id]/availability/calendar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainerId } = await params;
    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get('weekStart');
    
    // Get week start date or use current week
    const weekStart = weekStartParam 
      ? parseISO(weekStartParam) 
      : startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

    // Fetch trainer availability
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      include: {
        availability: {
          where: {
            isActive: true,
          },
        },
        blockedDates: {
          where: {
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        },
      },
    });

    if (!trainer) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    // Generate week calendar with availability
    const weekDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const availability = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(weekStart, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = weekDays[i];
      
      // Check if date is blocked
      const isBlocked = trainer.blockedDates?.some(
        blocked => format(blocked.date, 'yyyy-MM-dd') === dateStr
      );

      // Get availability for this day of week
      const dayAvailability = trainer.availability.filter(
        avail => avail.dayOfWeek === dayOfWeek
      );

      // Convert to time slots
      const slots = dayAvailability.map(avail => ({
        id: avail.id,
        startTime: avail.startTime,
        endTime: avail.endTime,
        maxBookings: 1, // Can be extended to support multiple bookings
      }));

      availability.push({
        date: dateStr,
        dayOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i],
        slots: isBlocked ? [] : slots,
        isBlocked,
      });
    }

    return NextResponse.json({
      success: true,
      availability,
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    });
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST /api/trainers/[id]/availability/calendar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainerId } = await params;
    const body = await request.json();
    const { availability } = body;

    if (!availability || !Array.isArray(availability)) {
      return NextResponse.json(
        { error: 'Invalid availability data' },
        { status: 400 }
      );
    }

    // Verify trainer exists
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
    });

    if (!trainer) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    // Process each day's availability
    const operations = [];
    
    for (const day of availability) {
      const { date, slots, isBlocked } = day;
      const dateObj = parseISO(date);
      const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dateObj.getDay()];

      if (isBlocked) {
        // Add to blocked dates
        operations.push(
          prisma.blockedDate.upsert({
            where: {
              trainerId_date: {
                trainerId,
                date: dateObj,
              },
            },
            update: {},
            create: {
              trainerId,
              date: dateObj,
              reason: 'Manual block',
            },
          })
        );
      } else {
        // Remove from blocked dates if exists
        operations.push(
          prisma.blockedDate.deleteMany({
            where: {
              trainerId,
              date: dateObj,
            },
          })
        );

        // Update availability slots for this day of week
        // First, delete existing slots for this day
        operations.push(
          prisma.availability.deleteMany({
            where: {
              trainerId,
              dayOfWeek,
            },
          })
        );

        // Then create new slots
        for (const slot of slots) {
          operations.push(
            prisma.availability.create({
              data: {
                trainerId,
                dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isActive: true,
              },
            })
          );
        }
      }
    }

    // Execute all operations in a transaction
    await prisma.$transaction(operations);

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
    });
  } catch (error) {
    console.error('Error updating calendar availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}

// DELETE /api/trainers/[id]/availability/calendar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainerId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const dateObj = parseISO(date);

    // Remove blocked date if exists
    await prisma.blockedDate.deleteMany({
      where: {
        trainerId,
        date: dateObj,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Date unblocked successfully',
    });
  } catch (error) {
    console.error('Error unblocking date:', error);
    return NextResponse.json(
      { error: 'Failed to unblock date' },
      { status: 500 }
    );
  }
}