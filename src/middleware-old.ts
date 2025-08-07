import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, refreshAccessToken, getRequestInfo } from '@/lib/auth';

// Routes that require authentication - only checking page routes now
// API routes handle their own authentication
const protectedRoutes: string[] = [
  '/dashboard',
  '/appointments',
  '/messages',
  '/schedule'
];

// Routes by role
const trainerRoutes = ['/dashboard/trainer'];
const clientRoutes = ['/dashboard/client'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get tokens from cookies or headers
  const accessToken = request.cookies.get('auth-token')?.value || 
                     request.cookies.get('access-token')?.value ||
                     request.headers.get('Authorization')?.replace('Bearer ', '');
                     
  const refreshToken = request.cookies.get('refresh-token')?.value;

  // Skip middleware for API routes (they handle auth internally)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Allow access to public routes
  if (!protectedRoutes.some(route => pathname.startsWith(route))) {
    // Redirect authenticated users away from auth pages
    if (authRoutes.includes(pathname) && accessToken) {
      try {
        const payload = verifyToken(accessToken);
        const dashboardUrl = payload.role === 'TRAINER' 
          ? '/dashboard/trainer' 
          : '/dashboard/client';
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      } catch {
        // Invalid token, let them access auth pages
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!accessToken) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // If no access token but have refresh token, redirect to refresh endpoint
    if (refreshToken) {
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      refreshUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(refreshUrl);
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = verifyToken(accessToken);
    
    // Role-based access control
    if (trainerRoutes.some(route => pathname.startsWith(route))) {
      if (payload.role !== 'TRAINER') {
        return NextResponse.redirect(new URL('/dashboard/client', request.url));
      }
    }
    
    if (clientRoutes.some(route => pathname.startsWith(route))) {
      if (payload.role !== 'CLIENT') {
        return NextResponse.redirect(new URL('/dashboard/trainer', request.url));
      }
    }

    // Redirect /dashboard to role-specific dashboard
    if (pathname === '/dashboard') {
      const dashboardUrl = payload.role === 'TRAINER' 
        ? '/dashboard/trainer' 
        : '/dashboard/client';
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    // Forward the authorization header for API routes
    requestHeaders.set('authorization', `Bearer ${accessToken}`);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error: any) {
    
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token', details: error.message },
        { status: 401 }
      );
    }
    
    // Token is invalid, try to refresh if refresh token exists
    if (refreshToken) {
      try {
        const { ipAddress, userAgent } = getRequestInfo(request);
        const refreshResult = await refreshAccessToken(refreshToken, ipAddress, userAgent);
        
        // Create response with new access token
        const response = NextResponse.next();
        response.cookies.set('access-token', refreshResult.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
        });
        
        // Also set the legacy cookie name for compatibility
        response.cookies.set('auth-token', refreshResult.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
        });

        // Add user info to headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', refreshResult.user.id);
        requestHeaders.set('x-user-email', refreshResult.user.email);
        requestHeaders.set('x-user-role', refreshResult.user.role);
        // Forward the new authorization header for API routes
        requestHeaders.set('authorization', `Bearer ${refreshResult.accessToken}`);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (refreshError) {
        // For API routes, return 401 instead of redirecting
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Token refresh failed' },
            { status: 401 }
          );
        }
        
        // Refresh failed, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        response.cookies.delete('access-token');
        response.cookies.delete('refresh-token');
        return response;
      }
    }

    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // No refresh token or refresh failed, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    response.cookies.delete('access-token');
    response.cookies.delete('refresh-token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/api/(dashboard|appointments|users|availability|trainers|messages|analytics|notifications|payments|reviews)/:path*',
  ],
};