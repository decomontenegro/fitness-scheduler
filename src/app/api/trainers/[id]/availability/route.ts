import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    // Get trainer
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      include: {
        user: true,
        availability: true,
      },
    });

    if (!trainer) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    // Get availability for the date
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Get trainer's availability for this day
    const availability = trainer.availability.find(a => parseInt(a.dayOfWeek) === dayOfWeek);

    if (!availability) {
      // No availability for this day, return empty slots
      return NextResponse.json({
        success: true,
        available: false,
        slots: [],
        message: 'Trainer is not available on this day',
      });
    }

    // Generate time slots
    const slots = [];
    const startHour = parseInt(availability.startTime.split(':')[0]);
    const endHour = parseInt(availability.endTime.split(':')[0]);

    // Get existing appointments for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        trainerId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    // Create slots for each hour
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hour, 0, 0, 0);

      // Check if this slot is already booked
      const isBooked = existingAppointments.some(apt => {
        const aptHour = apt.date.getHours();
        return aptHour === hour;
      });

      // Check if slot is in the past
      const isPast = slotDateTime < new Date();

      slots.push({
        id: `${trainerId}-${date}-${hour}`,
        time: timeString,
        available: !isBooked && !isPast,
        startTime: timeString,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isBooked,
        isPast,
      });
    }

    return NextResponse.json({
      success: true,
      available: availability.isActive,
      slots,
      availability: {
        dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
      },
    });

  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}