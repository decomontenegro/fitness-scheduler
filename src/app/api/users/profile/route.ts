import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  // Trainer specific fields
  bio: z.string().optional(),
  specialties: z.string().optional(),
  experience: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  // Client specific fields
  goals: z.string().optional(),
  medicalHistory: z.string().optional(),
  emergencyContact: z.string().optional(),
  birthDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        trainerProfile: userRole === 'TRAINER' ? {
          select: {
            id: true,
            bio: true,
            specialties: true,
            experience: true,
            hourlyRate: true,
            rating: true,
            totalReviews: true,
          },
        } : false,
        clientProfile: userRole === 'CLIENT' ? {
          select: {
            id: true,
            goals: true,
            medicalHistory: true,
            emergencyContact: true,
            birthDate: true,
          },
        } : false,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Separate user fields from profile fields
    const userFields: any = {};
    const profileFields: any = {};

    if (validatedData.name) userFields.name = validatedData.name;
    if (validatedData.phone !== undefined) userFields.phone = validatedData.phone;
    if (validatedData.avatar !== undefined) userFields.avatar = validatedData.avatar;

    // Role-specific profile fields
    if (userRole === 'TRAINER') {
      if (validatedData.bio !== undefined) profileFields.bio = validatedData.bio;
      if (validatedData.specialties !== undefined) profileFields.specialties = validatedData.specialties;
      if (validatedData.experience !== undefined) profileFields.experience = validatedData.experience;
      if (validatedData.hourlyRate !== undefined) profileFields.hourlyRate = validatedData.hourlyRate;
    } else if (userRole === 'CLIENT') {
      if (validatedData.goals !== undefined) profileFields.goals = validatedData.goals;
      if (validatedData.medicalHistory !== undefined) profileFields.medicalHistory = validatedData.medicalHistory;
      if (validatedData.emergencyContact !== undefined) profileFields.emergencyContact = validatedData.emergencyContact;
      if (validatedData.birthDate) profileFields.birthDate = new Date(validatedData.birthDate);
    }

    // Update user if there are user fields to update
    if (Object.keys(userFields).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userFields,
      });
    }

    // Update profile if there are profile fields to update
    if (Object.keys(profileFields).length > 0) {
      if (userRole === 'TRAINER') {
        await prisma.trainerProfile.update({
          where: { userId },
          data: profileFields,
        });
      } else if (userRole === 'CLIENT') {
        await prisma.clientProfile.update({
          where: { userId },
          data: profileFields,
        });
      }
    }

    // Fetch updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        trainerProfile: userRole === 'TRAINER' ? {
          select: {
            id: true,
            bio: true,
            specialties: true,
            experience: true,
            hourlyRate: true,
            rating: true,
            totalReviews: true,
          },
        } : false,
        clientProfile: userRole === 'CLIENT' ? {
          select: {
            id: true,
            goals: true,
            medicalHistory: true,
            emergencyContact: true,
            birthDate: true,
          },
        } : false,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}