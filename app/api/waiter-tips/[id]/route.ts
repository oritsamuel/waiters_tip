import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

import { HULUBEJE_API_URL, HULUBEJE_API_KEY } from '@/lib/config';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const response = await fetch(`${HULUBEJE_API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HULUBEJE_API_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Failed to fetch waiter.';
      return NextResponse.json({ success: false, error: message }, { status: response.status || 500 });
    }

    return NextResponse.json({ success: true, data: payload?.data ?? payload ?? null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
