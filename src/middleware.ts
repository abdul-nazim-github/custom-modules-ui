import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isRootPath = pathname === '/';

  // If user is authenticated and tries to access signin/signup or root, redirect to dashboard
  if (token && (isPublicRoute || isRootPath)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT authenticated and tries to access a protected route
  if (!token && !isPublicRoute) {
      // Allow access to API routes (except auth ones if needed, but usually API is protected differently or by this same middleware)
      // We should probably exclude /api/auth from this check or handle it specifically
      if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/contact')) {
          return NextResponse.next();
      }

      // For other protected pages, redirect to signin
      return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
