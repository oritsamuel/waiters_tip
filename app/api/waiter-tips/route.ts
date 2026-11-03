import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import {
  HULUBEJE_API_URL,
  HULUBEJE_API_KEY,
  DEFAULT_COMPANY_ID,
  DEFAULT_BRANCH_CODE,
} from '@/lib/config';

function buildExternalUrl(requestUrl: string) {
  const requestUrlObj = new URL(requestUrl);
  const externalUrl = new URL(HULUBEJE_API_URL);

  requestUrlObj.searchParams.forEach((value, key) => {
    if (key === 'branch') {
      return;
    }

    externalUrl.searchParams.set(key, value);
  });

  const requestedBranchId = requestUrlObj.searchParams.get('branchId');
  const requestedBranchCode = requestUrlObj.searchParams.get('branchCode');

  if (requestedBranchId && !requestedBranchCode) {
    externalUrl.searchParams.set('branchCode', requestedBranchId);
  }

  if (requestedBranchCode && !requestedBranchId) {
    externalUrl.searchParams.set('branchId', requestedBranchCode);
  }

  if (!externalUrl.searchParams.has('companyId')) {
    externalUrl.searchParams.set('companyId', DEFAULT_COMPANY_ID);
  }

  if (!externalUrl.searchParams.has('branchCode')) {
    externalUrl.searchParams.set('branchCode', DEFAULT_BRANCH_CODE);
  }

  if (!externalUrl.searchParams.has('branchId') && externalUrl.searchParams.has('branchCode')) {
    externalUrl.searchParams.set('branchId', externalUrl.searchParams.get('branchCode')!);
  }

  return externalUrl;
}

export async function GET(request: Request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const externalUrl = buildExternalUrl(request.url);
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HULUBEJE_API_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Failed to fetch waiters.';
      return NextResponse.json({ success: false, error: message }, { status: response.status || 500 });
    }

    return NextResponse.json({ success: true, data: payload?.data ?? payload ?? [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const fullName = (body.fullName ?? body.name ?? '').toString().trim();
    const phone = (body.phone ?? body.waiterPhoneNumber ?? '').toString().trim();
    const remark = (body.remark ?? body.comment ?? ' ').toString();

    if (!fullName || !phone) {
      return NextResponse.json({ success: false, error: 'fullName and phone are required.' }, { status: 400 });
    }

    const response = await fetch(HULUBEJE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HULUBEJE_API_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName,
        phone,
        remark,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Failed to create waiter.';
      return NextResponse.json({ success: false, error: message }, { status: response.status || 500 });
    }

    return NextResponse.json({ success: true, data: payload?.data ?? payload ?? null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
