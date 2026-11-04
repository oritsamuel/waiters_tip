import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

import {
  HULUBEJE_API_URL,
  HULUBEJE_API_KEY,
  DEFAULT_COMPANY_ID,
  DEFAULT_BRANCH_CODE,
} from '@/lib/config';

function buildExternalUrl(requestUrl: string, id: string) {
  const requestUrlObj = new URL(requestUrl);
  const externalUrl = new URL(`${HULUBEJE_API_URL}/${id}`);

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
    const externalUrl = buildExternalUrl(request.url, id);
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
      const message = payload?.message || payload?.error || 'Failed to fetch waiter.';
      return NextResponse.json({ success: false, error: message }, { status: response.status || 500 });
    }

    const data = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : payload?.data ?? payload ?? null;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
