import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  duration: z.number().min(15).max(480), // 15 min to 8 hours
  price: z.number().min(0),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Verificar se o trainer existe
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
        {
          success: false,
          error: 'Trainer não encontrado ou inativo',
        },
        { status: 404 }
      );
    }

    // Buscar serviços do trainer
    const services = await prisma.service.findMany({
      where: {
        trainerId: id,
        isActive: true,
      },
      orderBy: {
        price: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        trainerId: id,
        trainerName: trainer.user.name,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          formattedPrice: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(service.price),
          formattedDuration: `${service.duration} min`,
        })),
        totalServices: services.length,
      },
    });
  } catch (error) {
    console.error('Error fetching trainer services:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
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
    const validatedData = serviceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        ...validatedData,
        trainerId: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: service,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
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
    const serviceId = searchParams.get('serviceId');
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    }

    // Verify trainer owns this service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { trainer: true },
    });

    if (!service || service.trainer.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = serviceSchema.parse(body);

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedService,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
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
    const serviceId = searchParams.get('serviceId');
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    }

    // Verify trainer owns this service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { trainer: true },
    });

    if (!service || service.trainer.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if service has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId },
    });

    if (appointmentCount > 0) {
      // Soft delete - just deactivate
      await prisma.service.update({
        where: { id: serviceId },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Service deactivated (has existing appointments)',
      });
    } else {
      // Hard delete - no appointments
      await prisma.service.delete({
        where: { id: serviceId },
      });

      return NextResponse.json({
        success: true,
        message: 'Service deleted successfully',
      });
    }
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}