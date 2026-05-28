import type { NextRequest } from 'next/server';

type CookieSameSite = 'lax' | 'none' | 'strict';

type AuthCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: CookieSameSite;
  path: string;
};

const isProduction = process.env.NODE_ENV === 'production';

const getHostOrigin = (req: NextRequest) => {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  if (!host) return '';
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const proto = forwardedProto ?? (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${proto}://${host}`;
};

export function getAuthCookieOptions(req: NextRequest): AuthCookieOptions {
  const origin = req.headers.get('origin') ?? '';
  const hostOrigin = getHostOrigin(req);
  const isCrossSite = Boolean(origin && hostOrigin && origin !== hostOrigin);

  const sameSite: CookieSameSite = isCrossSite && isProduction ? 'none' : 'lax';
  const secure = sameSite === 'none' ? true : isProduction;

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };
}
