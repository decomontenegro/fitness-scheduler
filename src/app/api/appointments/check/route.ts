import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkConflictSchema = z.object({
  trainerId: z.string().min(1),
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  excludeAppointmentId: z.string().optional(), // Para edição de agendamentos
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = checkConflictSchema.parse(body);

    // Verificar se o trainer existe e está ativo
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: validatedData.trainerId },
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
          hasConflict: true,
        },
        { status: 404 }
      );
    }

    // Verificar se a data/hora está no passado
    const appointmentStart = new Date(validatedData.startTime);
    const now = new Date();
    
    if (appointmentStart <= now) {
      return NextResponse.json({
        success: true,
        hasConflict: true,
        conflictType: 'PAST_TIME',
        message: 'Não é possível agendar para uma data/hora no passado',
      });
    }

    // Verificar conflitos com outros agendamentos
    let whereClause: any = {
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
        {
          AND: [
            { startTime: { gte: new Date(validatedData.startTime) } },
            { endTime: { lte: new Date(validatedData.endTime) } },
          ],
        },
      ],
      status: { 
        in: ['PENDING', 'CONFIRMED'] 
      },
    };

    // Excluir um agendamento específico (para edição)
    if (validatedData.excludeAppointmentId) {
      whereClause.id = {
        not: validatedData.excludeAppointmentId,
      };
    }

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: whereClause,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json({
        success: true,
        hasConflict: true,
        conflictType: 'APPOINTMENT_OVERLAP',
        message: 'Já existe um agendamento neste horário',
        conflictDetails: {
          appointmentId: conflictingAppointment.id,
          clientName: conflictingAppointment.client.user.name,
          serviceName: conflictingAppointment.service?.name,
          startTime: conflictingAppointment.startTime,
          endTime: conflictingAppointment.endTime,
          status: conflictingAppointment.status,
        },
      });
    }

    // Verificar se está dentro da disponibilidade do trainer
    const requestDate = new Date(validatedData.date);
    const dayOfWeek = requestDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase().substring(0, 3);
    
    const availability = await prisma.availability.findFirst({
      where: {
        trainerId: validatedData.trainerId,
        dayOfWeek: dayOfWeek,
        isActive: true,
      },
    });

    if (!availability) {
      return NextResponse.json({
        success: true,
        hasConflict: true,
        conflictType: 'NO_AVAILABILITY',
        message: `Trainer não está disponível nas ${dayOfWeek.toLowerCase()}s`,
      });
    }

    // Verificar se o horário está dentro da disponibilidade
    const requestStartTime = appointmentStart.toTimeString().slice(0, 5); // HH:MM
    const requestEndTime = new Date(validatedData.endTime).toTimeString().slice(0, 5); // HH:MM
    
    const availStart = availability.startTime;
    const availEnd = availability.endTime;

    if (requestStartTime < availStart || requestEndTime > availEnd) {
      return NextResponse.json({
        success: true,
        hasConflict: true,
        conflictType: 'OUTSIDE_AVAILABILITY',
        message: `Horário fora da disponibilidade do trainer (${availStart} - ${availEnd})`,
        availabilityWindow: {
          start: availStart,
          end: availEnd,
        },
      });
    }

    // Nenhum conflito encontrado
    return NextResponse.json({
      success: true,
      hasConflict: false,
      message: 'Horário disponível para agendamento',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error checking appointment conflict:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}