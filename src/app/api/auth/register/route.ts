import { NextRequest, NextResponse } from 'next/server';
import { createUser, getRequestInfo } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['CLIENT', 'TRAINER']).optional(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { ipAddress, userAgent } = getRequestInfo(request);
    const user = await createUser(validatedData, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      user,
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'Email already exists',
      }, { status: 400 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Registration failed',
    }, { status: 500 });
  }
}