import { NextRequest, NextResponse } from 'next/server';
import { HULUBEJE_PUBLIC_API_URL, HULUBEJE_API_KEY } from '@/lib/config';

const HULUBEJE_API_URL = HULUBEJE_PUBLIC_API_URL;

/**
 * GET /api/waiter-tips/public?companyId=<id>&branchId=<id>
 *
 * Public directory — no authentication required.
 * Proxies to the external Hulubeje API and returns an array of PublicWaiterDto.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = Number(searchParams.get('companyId'));
    const branchId = Number(searchParams.get('branchId'));

    if (!companyId || companyId <= 0 || !branchId || branchId <= 0) {
      return NextResponse.json(
        { message: 'Company ID and branch ID must be greater than 0.' },
        { status: 400 },
      );
    }

    const externalUrl = new URL(HULUBEJE_API_URL);
    externalUrl.searchParams.set('companyId', String(companyId));
    externalUrl.searchParams.set('branchId', String(branchId));

    const response = await fetch(externalUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HULUBEJE_API_KEY,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Failed to fetch public waiter list.';
      return NextResponse.json(
        { message },
        { status: response.status || 500 },
      );
    }

    // Return the array directly (matching the PublicWaiterDto[] spec)
    const data = payload?.data ?? payload ?? [];
    return NextResponse.json(Array.isArray(data) ? data : [data]);
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
