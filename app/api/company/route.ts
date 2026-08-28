import { NextResponse } from 'next/server';
import { getCompanyData, updateCompanyWaiters } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const branchCode = searchParams.get('branchCode');

  if (!companyId || !branchCode) {
    return NextResponse.json({ error: 'Missing companyId or branchCode' }, { status: 400 });
  }

  const data = await getCompanyData(companyId, branchCode);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, branchCode, waiters } = body;

    if (!companyId || !branchCode || !Array.isArray(waiters)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await updateCompanyWaiters(companyId, branchCode, waiters);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
