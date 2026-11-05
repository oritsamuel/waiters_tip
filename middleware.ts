import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, hasCompanyAdminPrivileges, isLikelyJwt } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/company-admin/login' || pathname === '/company-admin') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/company-admin')) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!isLikelyJwt(token) || !hasCompanyAdminPrivileges(token)) {
      const url = request.nextUrl.clone();
      url.pathname = '/company-admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Public endpoint — no auth required
  if (pathname === '/api/waiter-tips/public') {
    return NextResponse.next();
  }

  // Tip recording endpoint — uses its own API-key auth, skip JWT
  if (pathname === '/api/waiter/tip') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/waiter-tips') || pathname.startsWith('/api/transaction')) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!isLikelyJwt(token) || !hasCompanyAdminPrivileges(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/company-admin/:path*',
    '/api/waiter-tips/:path*',
    '/api/waiter-tips',
    '/api/waiter/tip',
    '/api/transaction',
  ],
};
