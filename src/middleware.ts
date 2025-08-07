import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes: string[] = [
  '/dashboard',
  '/appointments',
  '/messages',
  '/schedule'
];

// Routes by role
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api/') || 
      pathname.includes('.') || 
      pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }
  
  // Skip middleware for public helper pages
  const publicPages = ['/app-launcher.html', '/login-helper.html', '/reset-system.html'];
  if (publicPages.some(page => pathname.includes(page))) {
    return NextResponse.next();
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
  
  // Don't auto-redirect from login if user has token
  // Let them navigate manually
  
  // For protected routes with a token, just pass through
  // The actual token validation will happen in the page/API route
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};