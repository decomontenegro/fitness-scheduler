import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getRequestInfo } from '@/lib/auth';
import { verifyAndEnable2FA, verify2FAToken } from '@/lib/twoFactor';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(6).max(6),
  action: z.enum(['enable', 'login']).optional().default('login'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action } = verifySchema.parse(body);

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

    let verified = false;

    if (action === 'enable') {
      // Enable 2FA after verification
      verified = await verifyAndEnable2FA(payload.userId, token, ipAddress, userAgent);
    } else {
      // Login verification
      verified = await verify2FAToken(payload.userId, token, ipAddress, userAgent);
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Invalid 2FA token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: action === 'enable' 
        ? 'Two-factor authentication enabled successfully' 
        : '2FA verification successful',
    });
  } catch (error: any) {
    console.error('2FA verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token format',
        details: error.errors,
      }, { status: 400 });
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('not set up')) {
      return NextResponse.json(
        { success: false, error: 'Two-factor authentication not set up' },
        { status: 400 }
      );
    }

    if (error.message.includes('already enabled')) {
      return NextResponse.json(
        { success: false, error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to verify 2FA token' },
      { status: 500 }
    );
  }
}