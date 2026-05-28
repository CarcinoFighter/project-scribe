import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

const ALLOWED_ORIGINS = new Set([
  'https://www.carcino.work',
  'https://carcino.work',
  'http://localhost',
  'http://localhost:3000',
  'capacitor://localhost',
  'ionic://localhost',
]);

const buildCorsHeaders = (origin: string | null) => {
  const headers = new Headers();

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }

  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return headers;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiPath = pathname.startsWith('/api/');
  const origin = request.headers.get('origin');
  const corsHeaders = isApiPath ? buildCorsHeaders(origin) : null;

  if (isApiPath && request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders ?? undefined });
  }

  // Public paths that don't require authentication
  const isPublicPath = 
    pathname === '/login' || 
    pathname === '/api/auth/login' || 
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/workbox-') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/splash') ||
    pathname.startsWith('/api/internal/sync-user') || 
    pathname.startsWith('/api/content/');

  const token = request.cookies.get('cw_token')?.value;

  if (!isPublicPath && !token) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
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
        if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value));
        return response;
      }
    }
  }

  const response = NextResponse.next();
  if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
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
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-).*)',
  ],
};
