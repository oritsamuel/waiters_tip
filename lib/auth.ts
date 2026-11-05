import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'hulubeje_admin_session';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  try {
    const payloadSegment = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadSegment.padEnd(Math.ceil(payloadSegment.length / 4) * 4, '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function hasTruthyFlag(payload: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => {
    const value = payload[key];

    if (typeof value === 'boolean') {
      return value === true;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === 'admin' || normalized === 'company_admin' || normalized === 'super_admin';
    }

    if (Array.isArray(value)) {
      return value.some((item) => {
        const text = String(item).trim().toLowerCase();
        return text === 'admin' || text === 'company_admin' || text === 'super_admin' || text === 'true';
      });
    }

    return false;
  });
}

export function isLikelyJwt(token: string | null | undefined): boolean {
  return !!token && typeof token === 'string' && token.split('.').length === 3;
}

export function hasCompanyAdminPrivileges(token: string | null | undefined): boolean {
  const payload = token ? decodeJwtPayload(token) : null;
  if (!payload) {
    return false;
  }

  const accountStatus = [
    payload.status,
    payload.accountStatus,
    payload.userStatus,
    payload.state,
    payload.account_status,
  ].map((value) => String(value ?? '').trim().toLowerCase());

  const isTerminated =
    payload.isTerminated === true ||
    payload.terminated === true ||
    payload.isInactive === true ||
    payload.inactive === true ||
    payload.isDisabled === true ||
    payload.disabled === true ||
    payload.isActive === false ||
    payload.active === false ||
    accountStatus.some((value) => value === 'terminated' || value === 'inactive' || value === 'disabled');

  if (isTerminated) {
    return false;
  }

  const roleEntries = [
    ...normalizeStringList(payload.role),
    ...normalizeStringList(payload.roles),
    ...normalizeStringList(payload.scopes),
    ...normalizeStringList(payload.privileges),
    ...normalizeStringList(payload.permissions),
  ];

  const isAdminRole = roleEntries.some((value) => {
    const normalized = value.toLowerCase();
    return normalized === 'admin' || normalized === 'company_admin' || normalized === 'super_admin' || normalized === 'owner';
  });

  const isAdminFlag = hasTruthyFlag(payload, [
    'isAdmin',
    'admin',
    'is_admin',
    'hasAdminAccess',
    'adminAccess',
    'isCompanyAdmin',
    'companyAdmin',
    'isSuperAdmin',
    'superAdmin',
  ]);

  return isAdminRole || isAdminFlag;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
  return isLikelyJwt(token) && hasCompanyAdminPrivileges(token) ? token : null;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
