import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getRequestInfo } from '@/lib/auth';
import { rateLimit, resetRateLimit, getClientIP, getRateLimitHeaders } from '@/lib/rateLimit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limit first - TEMPORARILY DISABLED FOR TESTING
    // const rateLimitInfo = await rateLimit(request, 'login');
    
    // if (!rateLimitInfo.allowed) {
    //   const headers = getRateLimitHeaders(rateLimitInfo);
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Muitas tentativas de login. Tente novamente mais tarde.',
    //     retryAfter: Math.ceil((rateLimitInfo.msBeforeNext || 0) / 1000),
    //   }, { 
    //     status: 429,
    //     headers 
    //   });
    // }

    const body = await request.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    const { ipAddress, userAgent } = getRequestInfo(request);
    
    try {
      const result = await authenticateUser(email, password, rememberMe, ipAddress, userAgent);
      
      // Reset rate limit on successful login - TEMPORARILY DISABLED
      // const ip = getClientIP(request);
      // await resetRateLimit('login', ip);
      
      // Set cookies with tokens
      const response = NextResponse.json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        requiresTwoFactor: result.requiresTwoFactor,
      });

      // Set access token cookie (short-lived)
      response.cookies.set('access-token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/'
      });

      // Also set the legacy cookie name for compatibility
      response.cookies.set('auth-token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/'
      });

      // Set refresh token cookie (long-lived)
      const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days
      response.cookies.set('refresh-token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshMaxAge,
        path: '/',
      });

      return response;
    } catch (authError: any) {
      // Authentication failed, but don't consume additional rate limit points
      throw authError;
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data',
        details: error.errors,
      }, { status: 400 });
    }

    if (error.message.includes('Invalid credentials')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }

    if (error.message.includes('locked')) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 423 }); // Locked status code
    }

    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed',
    }, { status: 500 });
  }
}