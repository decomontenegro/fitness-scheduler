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