import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getRequestInfo } from '@/lib/auth';
import { disable2FA } from '@/lib/twoFactor';
import { z } from 'zod';

const disableSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = disableSchema.parse(body);

    // Get user from token
    const accessToken = request.cookies.get('auth-token')?.value || 
                       request.cookies.get('access-token')?.value ||
                       request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(accessToken);
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Disable 2FA
    await disable2FA(payload.userId, password, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error: any) {
    console.error('2FA disable error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      }, { status: 400 });
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('not enabled')) {
      return NextResponse.json(
        { success: false, error: 'Two-factor authentication is not enabled' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid password')) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}