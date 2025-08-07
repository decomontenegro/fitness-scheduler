import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, getRequestInfo } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh-token')?.value;
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/dashboard';

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { ipAddress, userAgent } = getRequestInfo(request);
    const result = await refreshAccessToken(refreshToken, ipAddress, userAgent);

    // Create redirect response
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // Set new access token cookie
    response.cookies.set('access-token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });
    
    // Also set the legacy cookie name for compatibility
    response.cookies.set('auth-token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    // Refresh failed, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    response.cookies.delete('access-token');
    response.cookies.delete('refresh-token');
    return response;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token required' },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getRequestInfo(request);
    const result = await refreshAccessToken(refreshToken, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}