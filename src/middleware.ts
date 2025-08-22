import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes: string[] = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/contact',
  '/about',
  '/pricing',
  '/terms',
  '/privacy'
];

// Routes that require authentication
const protectedRoutes: string[] = [
  '/dashboard',
  '/appointments', 
  '/messages',
  '/schedule',
  '/trainer',
  '/notifications',
  '/analytics',
  '/client-analytics',
  '/admin-analytics',
  '/reports',
  '/profile',
  '/settings',
  '/booking',
  '/booking-test'
];

// Routes that require specific roles
const trainerOnlyRoutes: string[] = [
  '/trainer/availability',
  '/trainer/services',
  '/trainer/schedule',
  '/admin-analytics',
  '/reports'
];

const clientOnlyRoutes: string[] = [
  '/client-analytics'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response with CSP headers
  let response = NextResponse.next();
  
  // Add Content Security Policy headers to allow Google Fonts
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:* https://*; " +
    "img-src 'self' data: blob: https:; " +
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
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Special handling for homepage
  if (pathname === '/') {
    if (!tokenValue) {
      // If user is not authenticated, show landing page (keep on /)
      console.log(`[Middleware] Homepage - no auth, showing landing page`);
      return response;
    } else {
      // If user is authenticated, redirect to appropriate dashboard
      console.log(`[Middleware] Homepage - authenticated, redirecting to dashboard`);
      // TODO: Decode token to get user role and redirect accordingly
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    // If user is already logged in and tries to access login/register, redirect to dashboard
    if (tokenValue && (pathname === '/login' || pathname === '/register')) {
      console.log(`[Middleware] User already authenticated, redirecting to dashboard`);
      return NextResponse.redirect(new URL('/dashboard/client', request.url));
    }
    return response;
  }
  
  // Check if route needs protection
  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route));
  
  // If route needs auth and no token, redirect to login
  if (needsAuth && !tokenValue) {
    console.log(`[Middleware] Protected route without token, redirecting to login`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check if route is trainer-only
  const isTrainerRoute = trainerOnlyRoutes.some(route => pathname.startsWith(route));
  if (isTrainerRoute && tokenValue) {
    // TODO: Decode JWT and check if user role is TRAINER
    console.log(`[Middleware] Trainer route accessed: ${pathname}`);
  }
  
  // Check if route is client-only
  const isClientRoute = clientOnlyRoutes.some(route => pathname.startsWith(route));
  if (isClientRoute && tokenValue) {
    // TODO: Decode JWT and check if user role is CLIENT
    console.log(`[Middleware] Client route accessed: ${pathname}`);
  }
  
  // For all other routes with a token, pass through
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};