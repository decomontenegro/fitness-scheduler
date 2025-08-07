import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, addDays, parseISO, isSameDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const date = searchParams.get('date');
    const days = parseInt(searchParams.get('days') || '7');

    if (!trainerId) {
      return NextResponse.json({ error: 'trainerId is required' }, { status: 400 });
    }

    // Get trainer availability
    const availability = await prisma.availability.findMany({
      where: {
        trainerId,
        isActive: true,
      },
    });

    if (availability.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    const startDate = date ? parseISO(date) : new Date();
    const slots = [];

    // Generate slots for the next 'days' days
    for (let i = 0; i < days; i++) {
      const currentDate = addDays(startDate, i);
      const dayOfWeek = format(currentDate, 'EEEE').toUpperCase();

      // Find availability for this day
      const dayAvailability = availability.filter(
        av => av.dayOfWeek === dayOfWeek
      );

      for (const avail of dayAvailability) {
        // Generate hourly slots between start and end time
        const startTime = avail.startTime.split(':');
        const endTime = avail.endTime.split(':');
        
        const startHour = parseInt(startTime[0]);
        const endHour = parseInt(endTime[0]);

        for (let hour = startHour; hour < endHour; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);
          
          const slotEnd = new Date(currentDate);
          slotEnd.setHours(hour + 1, 0, 0, 0);

          slots.push({
            date: format(currentDate, 'yyyy-MM-dd'),
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true, // Will be updated based on bookings
          });
        }
      }
    }

    // Check for existing appointments to mark slots as unavailable
    if (slots.length > 0) {
      const dateRange = {
        gte: new Date(slots[0].startTime),
        lte: new Date(slots[slots.length - 1].endTime),
      };

      const existingAppointments = await prisma.appointment.findMany({
        where: {
          trainerId,
          date: dateRange,
          status: { not: 'CANCELLED' },
        },
        select: {
          date: true,
          startTime: true,
          endTime: true,
        },
      });

      // Mark conflicting slots as unavailable
      slots.forEach(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);

        const hasConflict = existingAppointments.some(appointment => {
          const appStart = new Date(appointment.startTime);
          const appEnd = new Date(appointment.endTime);

          return (
            isSameDay(slotStart, appStart) &&
            ((slotStart >= appStart && slotStart < appEnd) ||
             (slotEnd > appStart && slotEnd <= appEnd) ||
             (slotStart <= appStart && slotEnd >= appEnd))
          );
        });

        if (hasConflict) {
          slot.available = false;
        }
      });
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}