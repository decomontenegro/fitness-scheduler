import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  reason: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, reason } = updateStatusSchema.parse(body);

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        trainer: true,
        client: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions
    let canUpdate = false;
    
    if (userRole === 'TRAINER') {
      const trainerProfile = await prisma.trainerProfile.findUnique({
        where: { userId },
      });
      canUpdate = trainerProfile?.id === appointment.trainerId;
    } else if (userRole === 'CLIENT') {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId },
      });
      // Clients can only cancel their own appointments
      canUpdate = clientProfile?.id === appointment.clientId && status === 'CANCELLED';
    }

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status,
        ...(reason && { notes: appointment.notes ? `${appointment.notes}\n\n[Status Update]: ${reason}` : reason }),
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

    // TODO: Send notifications to client/trainer about status change
    // This will be implemented in Phase 2 with real email/push notifications

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update appointment status error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        trainer: true,
        client: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions - only trainers can delete
    if (userRole !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can delete appointments' }, { status: 403 });
    }

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId },
    });

    if (trainerProfile?.id !== appointment.trainerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}