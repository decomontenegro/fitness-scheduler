import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD

    // Verificar se o trainer existe
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!trainer || !trainer.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trainer não encontrado ou inativo',
        },
        { status: 404 }
      );
    }

    // Buscar disponibilidade do trainer
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

    // Se uma data específica foi fornecida, buscar agendamentos para essa data
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

    // Gerar slots de horário disponíveis
    const generateTimeSlots = (availability: any[], bookedSlots: any[], targetDate?: string) => {
      if (!targetDate) return [];

      const date = new Date(targetDate);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      
      // Encontrar disponibilidade para o dia da semana
      const dayAvailability = availability.filter(a => 
        a.dayOfWeek.toUpperCase() === dayOfWeek
      );

      const slots: any[] = [];

      dayAvailability.forEach(avail => {
        const startHour = parseInt(avail.startTime.split(':')[0]);
        const startMinute = parseInt(avail.startTime.split(':')[1]);
        const endHour = parseInt(avail.endTime.split(':')[0]);
        const endMinute = parseInt(avail.endTime.split(':')[1]);

        // Gerar slots de 1 hora
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

          // Verificar se o slot não está reservado
          const isBooked = bookedSlots.some(booking => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            
            return (
              (slotStart >= bookingStart && slotStart < bookingEnd) ||
              (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
              (slotStart <= bookingStart && slotEnd >= bookingEnd)
            );
          });

          // Verificar se o slot não está no passado
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
        availability: availability.map(a => ({
          id: a.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
        availableSlots: availableSlots,
        requestedDate: date,
      },
    });
  } catch (error) {
    console.error('Error fetching trainer availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}