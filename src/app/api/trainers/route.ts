import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const trainers = await prisma.trainerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      where: {
        user: {
          isActive: true,
        },
      },
    });

    const trainersWithStats = trainers.map(trainer => ({
      id: trainer.id,
      userId: trainer.userId,
      name: trainer.user.name,
      email: trainer.user.email,
      avatar: trainer.user.avatar,
      bio: trainer.bio,
      specialties: trainer.specialties,
      experience: trainer.experience,
      hourlyRate: trainer.hourlyRate,
      rating: trainer.rating,
      totalReviews: trainer.totalReviews,
      reviewCount: trainer._count.reviews,
      services: trainer.services,
    }));

    return NextResponse.json({
      success: true,
      data: trainersWithStats,
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