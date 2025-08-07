import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getRequestInfo } from '@/lib/auth';
import { getBackupCodesCount, regenerateBackupCodes } from '@/lib/twoFactor';
import { z } from 'zod';

export async function GET(request: NextRequest) {
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

    // Get backup codes count
    const count = await getBackupCodesCount(payload.userId);

    return NextResponse.json({
      success: true,
      backupCodesCount: count,
    });
  } catch (error: any) {
    console.error('Get backup codes error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get backup codes info' },
      { status: 500 }
    );
  }
}

const regenerateSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = regenerateSchema.parse(body);

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

    // Regenerate backup codes
    const newBackupCodes = await regenerateBackupCodes(payload.userId, password, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      backupCodes: newBackupCodes,
      message: 'Backup codes regenerated successfully',
    });
  } catch (error: any) {
    console.error('Regenerate backup codes error:', error);

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
      { success: false, error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}