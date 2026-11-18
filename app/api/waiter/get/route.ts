import { NextRequest, NextResponse } from 'next/server';
import { HULUBEJE_API_KEY, HULUBEJE_AUTH_TOKEN } from '@/lib/config';

const WAITER_GET_URL = 'https://v7-hulubeje.cnetcommerce.com/api/waiter/get';

export async function GET(request: NextRequest) {
  const phoneNumber = request.nextUrl.searchParams.get('phoneNumber')?.trim();
  const companyId = request.nextUrl.searchParams.get('companyId')?.trim();

  if (!phoneNumber || !companyId) {
    return NextResponse.json(
      { success: false, message: 'phoneNumber and companyId are required.' },
      { status: 400 },
    );
  }

  try {
    const url = new URL(WAITER_GET_URL);
    url.searchParams.set('phoneNumber', phoneNumber);
    url.searchParams.set('companyId', companyId);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HULUBEJE_API_KEY,
        Authorization: `Bearer ${HULUBEJE_AUTH_TOKEN}`,
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: payload?.message || payload?.error || 'Failed to fetch waiter rating.' },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json(payload ?? { success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}