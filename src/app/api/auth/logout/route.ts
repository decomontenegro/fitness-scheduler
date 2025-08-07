import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken, revokeAllUserTokens, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logoutAll = false } = body;

    const accessToken = request.cookies.get('auth-token')?.value || 
                       request.cookies.get('access-token')?.value ||
                       request.headers.get('Authorization')?.replace('Bearer ', '');
                       
    const refreshToken = request.cookies.get('refresh-token')?.value;

    let userId: string | undefined;

    // Try to get user ID from access token
    if (accessToken) {
      try {
        const payload = verifyToken(accessToken);
        userId = payload.userId;
      } catch {
        // Token might be expired, ignore
      }
    }

    // Revoke tokens
    if (logoutAll && userId) {
      await revokeAllUserTokens(userId);
    } else if (refreshToken) {
      await revokeRefreshToken(refreshToken, userId);
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: logoutAll ? 'Logged out from all devices' : 'Logged out successfully',
    });

    // Clear all auth cookies
    response.cookies.delete('auth-token');
    response.cookies.delete('access-token');
    response.cookies.delete('refresh-token');

    // Also clear with explicit options to ensure removal
    response.cookies.set('auth-token', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    response.cookies.set('access-token', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    response.cookies.set('refresh-token', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if logout fails, clear cookies client-side
    const response = NextResponse.json({
      success: true,
      message: 'Logged out (with cleanup)',
    });

    response.cookies.delete('auth-token');
    response.cookies.delete('access-token');
    response.cookies.delete('refresh-token');

    return response;
  }
}