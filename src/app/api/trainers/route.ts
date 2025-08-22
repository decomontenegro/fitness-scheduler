import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const trainers = await prisma.trainerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        services: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
        availability: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            dayOfWeek: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            appointments: true,
          },
        },
      },
      where: {
        user: {
          isActive: true,
          role: 'TRAINER',
        },
      },
    });

    const trainersWithStats = trainers.map(trainer => ({
      id: trainer.id,
      userId: trainer.userId,
      name: trainer.user.name,
      email: trainer.user.email,
      phone: trainer.user.phone,
      avatar: trainer.user.avatar,
      bio: trainer.bio,
      specialties: trainer.specialties,
      experience: trainer.experience,
      hourlyRate: trainer.hourlyRate || 100,
      rating: trainer.rating || 0,
      totalReviews: trainer.totalReviews || trainer._count.reviews,
      reviewCount: trainer._count.reviews,
      appointmentCount: trainer._count.appointments,
      services: trainer.services,
      hasAvailability: trainer.availability.length > 0,
    }));

    return NextResponse.json({
      success: true,
      trainers: trainersWithStats,
    });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}