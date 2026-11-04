import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { findWaiterByIdentifier, setWaiterActiveState } from '@/lib/db';

import { HULUBEJE_API_URL, HULUBEJE_API_KEY } from '@/lib/config';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const waiterIdentifier = String(id ?? '').trim();

    const existingWaiter = await findWaiterByIdentifier(waiterIdentifier);
    const externalId = existingWaiter?.id ? String(existingWaiter.id) : waiterIdentifier;

    const response = await fetch(`${HULUBEJE_API_URL}/${encodeURIComponent(externalId)}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HULUBEJE_API_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => null);
    const localUpdated = existingWaiter
      ? await setWaiterActiveState(existingWaiter.id || existingWaiter.phone || externalId, true)
      : await setWaiterActiveState(waiterIdentifier, true);

    if (!response.ok && !localUpdated) {
      const message = payload?.message || payload?.error || 'Failed to activate waiter.';
      return NextResponse.json({ success: false, error: message }, { status: response.status || 500 });
    }

    return NextResponse.json({
      success: true,
      data: payload?.data ?? payload ?? { id: externalId, isActive: true, updatedLocally: localUpdated },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
