import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getRequestInfo } from '@/lib/auth';
import { setupTwoFactor } from '@/lib/twoFactor';

export async function POST(request: NextRequest) {
  try {
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

    // Setup 2FA
    const setup = await setupTwoFactor(payload.userId);

    return NextResponse.json({
      success: true,
      data: setup,
    });
  } catch (error: any) {
    console.error('2FA setup error:', error);
    
    if (error.message.includes('already enabled')) {
      return NextResponse.json(
        { success: false, error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}