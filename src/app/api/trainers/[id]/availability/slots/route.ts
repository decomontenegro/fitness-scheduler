import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, parseISO, addMinutes, isAfter, isBefore, setHours, setMinutes } from 'date-fns';

// GET /api/trainers/[id]/availability/slots?date=2024-01-15
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainerId } = await params;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const requestedDate = parseISO(dateParam);
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][requestedDate.getDay()];

    // Check if trainer exists
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      include: {
        availability: {
          where: {
            dayOfWeek,
            isActive: true,
          },
        },
        blockedDates: {
          where: {
            date: {
              gte: new Date(dateParam),
              lt: addMinutes(new Date(dateParam), 1440), // Next day
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

    // Check if date is blocked
    if (trainer.blockedDates.length > 0) {
      return NextResponse.json({
        success: true,
        slots: [],
        message: 'Trainer is not available on this date',
      });
    }

    // Get existing appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        trainerId,
        date: {
          gte: new Date(dateParam),
          lt: addMinutes(new Date(dateParam), 1440),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    // Generate time slots based on availability
    const slots: any[] = [];
    const slotDuration = 60; // 60 minutes per slot

    for (const avail of trainer.availability) {
      const [startHour, startMinute] = avail.startTime.split(':').map(Number);
      const [endHour, endMinute] = avail.endTime.split(':').map(Number);

      let currentTime = setMinutes(setHours(requestedDate, startHour), startMinute);
      const endTime = setMinutes(setHours(requestedDate, endHour), endMinute);

      while (isBefore(currentTime, endTime)) {
        const slotEndTime = addMinutes(currentTime, slotDuration);

        // Check if slot is already booked
        const isBooked = existingAppointments.some(apt => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          return (
            (isAfter(currentTime, aptStart) && isBefore(currentTime, aptEnd)) ||
            (isAfter(slotEndTime, aptStart) && isBefore(slotEndTime, aptEnd)) ||
            (isBefore(currentTime, aptStart) && isAfter(slotEndTime, aptEnd))
          );
        });

        // Check if slot is in the past
        const isPast = isBefore(currentTime, new Date());

        slots.push({
          id: `${format(currentTime, 'HHmm')}`,
          time: format(currentTime, 'HH:mm'),
          startTime: format(currentTime, 'HH:mm'),
          endTime: format(slotEndTime, 'HH:mm'),
          available: !isBooked && !isPast,
          isBooked,
          isPast,
        });

        currentTime = slotEndTime;
      }
    }

    return NextResponse.json({
      success: true,
      slots,
      date: dateParam,
      dayOfWeek,
    });
  } catch (error) {
    console.error('Error fetching availability slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability slots' },
      { status: 500 }
    );
  }
}