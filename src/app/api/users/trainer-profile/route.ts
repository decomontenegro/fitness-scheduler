import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/users/trainer-profile - Create trainer profile
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'TRAINER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.trainerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json(existingProfile);
    }

    // Create new trainer profile
    const newProfile = await prisma.trainerProfile.create({
      data: {
        userId,
        bio: '',
        specialties: '',
        experience: 0,
        hourlyRate: 100,
        rating: 0,
        totalReviews: 0,
      },
    });

    return NextResponse.json(newProfile);
  } catch (error) {
    console.error('Error creating trainer profile:', error);
    return NextResponse.json(
      { error: 'Failed to create trainer profile' },
      { status: 500 }
    );
  }
}