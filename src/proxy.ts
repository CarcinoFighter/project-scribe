import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const isPublicPath = 
    pathname === '/login' || 
    pathname === '/api/auth/login' || 
    pathname.startsWith('/api/internal/sync-user') || 
    pathname.startsWith('/api/content/');

  const token = request.cookies.get('cw_token')?.value;

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      // Verify token using jose for edge compatibility
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jose.jwtVerify(token, secret);

      // If on login page and authenticated, redirect to dashboard
      if (pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // If token is invalid and not a public path, redirect to login
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('cw_token', '', { maxAge: 0 });
        return response;
      }
    }
  }

  return NextResponse.next();
}

// Rename this for the proxy entry point if needed
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
