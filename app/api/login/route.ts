import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
import { HULUBEJE_AUTH_URL, HULUBEJE_API_KEY, HULUBEJE_AUTH_TOKEN } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = (body.phoneNumber ?? body.phone ?? body.username ?? body.code ?? '').toString().trim();
    const password = (body.password ?? '').toString().trim();

    if (!rawPhone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required.' }, { status: 400 });
    }

    const authAttempts = [
      { Authorization: HULUBEJE_AUTH_TOKEN },
      { Authorization: `Bearer ${HULUBEJE_AUTH_TOKEN}` },
    ];

    let lastPayload: any = null;
    let lastResponseStatus = 0;

    for (const authHeader of authAttempts) {
      const response = await fetch(HULUBEJE_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': HULUBEJE_API_KEY,
          ...authHeader,
        },
        body: JSON.stringify({
          code: rawPhone,
          password,
        }),
      });

      lastResponseStatus = response.status;
      lastPayload = await response.json().catch(() => null);

      if (response.ok || (response.status !== 401 && response.status !== 403)) {
        break;
      }
    }

    const authSucceeded = lastPayload?.isSuccessful === true || lastPayload?.success === true;
    if (!authSucceeded) {
      const message = Array.isArray(lastPayload?.errorMessages)
        ? lastPayload.errorMessages[0]
        : lastPayload?.message || 'Incorrect phone number or password.';

      return NextResponse.json({ error: message }, { status: lastResponseStatus === 200 ? 401 : lastResponseStatus || 401 });
    }

    const token = lastPayload?.data?.token || lastPayload?.token;
    if (!token) {
      return NextResponse.json({ error: 'Authentication succeeded but no token was returned.' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
