import { NextResponse } from 'next/server';
import { getCompanyData, updateCompanyWaiters } from '@/lib/db';
import { restaurants } from '@/lib/restaurants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch');
  const restaurant = branch ? restaurants[branch] : undefined;
  const companyId = searchParams.get('companyId');
  const branchCode = searchParams.get('branchCode');

  if (restaurant) {
    const data = await getCompanyData(restaurant.companyId, restaurant.branchCode);
    return NextResponse.json(data);
  }

  if (!companyId || !branchCode) {
    return NextResponse.json({ error: 'Branch not found.' }, { status: 400 });
  }

  const data = await getCompanyData(companyId, branchCode);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { branch, waiters } = body;
    const restaurant = branch ? restaurants[branch] : undefined;
    const companyId = body.companyId;
    const branchCode = body.branchCode;

    if (!Array.isArray(waiters) || (!restaurant && (!companyId || !branchCode))) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await updateCompanyWaiters(
      restaurant?.companyId ?? companyId,
      restaurant?.branchCode ?? branchCode,
      waiters,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
