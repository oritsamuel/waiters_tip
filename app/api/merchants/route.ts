import { NextRequest, NextResponse } from 'next/server';
import { HULUBEJE_API_KEY, HULUBEJE_AUTH_TOKEN } from '@/lib/config';

const MERCHANTS_URL = 'https://v7-hulubeje.cnetcommerce.com/api/auth/merchants';

type MerchantRecord = Record<string, unknown>;

function normalizeMerchantList(payload: unknown): MerchantRecord[] {
  if (Array.isArray(payload)) return payload as MerchantRecord[];

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as MerchantRecord[];
    if (Array.isArray(obj.items)) return obj.items as MerchantRecord[];
    if (obj.data && typeof obj.data === 'object') return [obj.data as MerchantRecord];
    if (obj.items && typeof obj.items === 'object') return [obj.items as MerchantRecord];
    return [obj];
  }

  return [];
}

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId')?.trim();

    if (!companyId) {
      return NextResponse.json(
        { message: 'companyId is required.' },
        { status: 400 }
      );
    }

    const response = await fetch(MERCHANTS_URL, {
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
        {
          message: payload?.message || payload?.error || 'Failed to fetch merchant list.',
        },
        { status: response.status || 500 }
      );
    }

    const merchants = normalizeMerchantList(payload);
    const matchedMerchant = merchants.find((merchant: MerchantRecord) => {
      const company = merchant.company as Record<string, unknown> | undefined;
      const merchantObj = merchant.merchant as Record<string, unknown> | undefined;
      const candidates = [
        merchant.id,
        merchant.companyId,
        merchant.merchantId,
        company?.id,
        merchantObj?.id,
        merchant.company_id,
        merchant.merchant_id,
      ];

      return candidates.some((value) => value != null && String(value) === String(companyId));
    });

    return NextResponse.json({
      success: true,
      data: matchedMerchant ? [matchedMerchant] : [],
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
