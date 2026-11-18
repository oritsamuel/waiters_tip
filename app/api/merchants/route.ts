import { NextRequest, NextResponse } from 'next/server';
import { HULUBEJE_API_KEY, HULUBEJE_AUTH_TOKEN } from '@/lib/config';

const MERCHANTS_URL = 'https://v7-hulubeje.cnetcommerce.com/api/auth/merchants';
const COMPANY_BY_TIN_URL = 'https://v7-hulubeje.cnetcommerce.com/api/routing/getcompanybytin';

type MerchantRecord = Record<string, unknown>;

function findFieldValue(record: MerchantRecord, fieldNames: string[]): string | undefined {
  const wantedNames = new Set(fieldNames.map((name) => name.toLowerCase()));
  const value = Object.entries(record).find(([key, fieldValue]) =>
    wantedNames.has(key.toLowerCase()) && (
      (typeof fieldValue === 'string' && fieldValue.trim()) ||
      (typeof fieldValue === 'number' && Number.isFinite(fieldValue))
    )
  )?.[1];

  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : undefined;
}

function findCompanyLogo(payload: unknown): string | undefined {
  const logoFields = new Set(['logo', 'logourl', 'companylogo', 'companylogourl', 'imageurl']);

  const search = (value: unknown): string | undefined => {
    if (Array.isArray(value)) {
      for (const item of value) {
        const logo = search(item);
        if (logo) return logo;
      }
      return undefined;
    }

    if (!value || typeof value !== 'object') return undefined;

    const record = value as MerchantRecord;
    for (const [key, fieldValue] of Object.entries(record)) {
      if (logoFields.has(key.toLowerCase()) && typeof fieldValue === 'string' && fieldValue.trim()) {
        return fieldValue.trim();
      }
    }

    for (const fieldValue of Object.values(record)) {
      const logo = search(fieldValue);
      if (logo) return logo;
    }
    return undefined;
  };

  return search(payload);
}

async function getCompanyLogoByTin(tin: string): Promise<string | undefined> {
  const url = new URL(COMPANY_BY_TIN_URL);
  url.searchParams.set('tin', tin);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HULUBEJE_API_KEY,
      Authorization: `Bearer ${HULUBEJE_AUTH_TOKEN}`,
    },
  });

  if (!response.ok) return undefined;

  const payload = await response.json().catch(() => null);
  return findCompanyLogo(payload);
}

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

    let companyLogo: string | undefined;
    if (matchedMerchant) {
      const company = matchedMerchant.company as MerchantRecord | undefined;
      const merchant = matchedMerchant.merchant as MerchantRecord | undefined;
      const tin = [matchedMerchant, company, merchant]
        .filter((record): record is MerchantRecord => !!record)
        .map((record) => findFieldValue(record, [
          'tin',
          'companyTin',
          'tinNumber',
          'companyTinNumber',
          'taxIdentificationNumber',
          'taxId',
          'companyTaxId',
        ]))
        .find(Boolean);

      if (tin) {
        try {
          companyLogo = await getCompanyLogoByTin(tin);
        } catch {
          companyLogo = undefined;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: matchedMerchant
        ? [{
            ...matchedMerchant,
            companyLogo: companyLogo || findCompanyLogo(matchedMerchant),
          }]
        : [],
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
