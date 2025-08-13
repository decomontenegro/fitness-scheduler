import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes: string[] = [
  '/dashboard',
  '/appointments',
  '/messages',
  '/schedule',
  '/trainer'
];

// Routes that require specific roles
const trainerOnlyRoutes: string[] = [
  '/trainer/availability',
  '/trainer/services',
  '/trainer/schedule'
];

// Routes by role
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response with CSP headers
  const response = NextResponse.next();
  
  // Add Content Security Policy headers to allow Google Fonts
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "connect-src 'self' ws://localhost:* wss://localhost:*; " +
    "img-src 'self' data: blob:; " +
    "frame-src 'self';"
  );
  
  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api/') || 
      pathname.includes('.') || 
      pathname.startsWith('/_next/')) {
    return response;
  }
  
  // Skip middleware for public helper pages
  const publicPages = ['/app-launcher.html', '/login-helper.html', '/reset-system.html'];
  if (publicPages.some(page => pathname.includes(page))) {
    return response;
  }
  
  // Get tokens from cookies
  const authToken = request.cookies.get('auth-token');
  const accessToken = request.cookies.get('access-token');
  const tokenValue = authToken?.value || accessToken?.value;
  
  console.log(`[Middleware] Path: ${pathname}`);
  console.log(`[Middleware] Has token:`, !!tokenValue);
  
  // Check if route needs protection
  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route));
  
  // If route needs auth and no token, redirect to login
  if (needsAuth && !tokenValue) {
    console.log(`[Middleware] No token, redirecting to login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check if route is trainer-only
  const isTrainerRoute = trainerOnlyRoutes.some(route => pathname.startsWith(route));
  if (isTrainerRoute && tokenValue) {
    // Note: In production, you'd want to decode and validate the JWT here
    // For now, we'll rely on the page component to check the role
    console.log(`[Middleware] Trainer route accessed: ${pathname}`);
  }
  
  // Don't auto-redirect from login if user has token
  // Let them navigate manually
  
  // For protected routes with a token, just pass through
  // The actual token validation will happen in the page/API route
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};