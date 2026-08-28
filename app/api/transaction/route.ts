import { NextResponse } from 'next/server';
import { addTransaction } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, branchCode, waiterPhone, payerPhone, tipAmount, rating, comment } = body;

    if (!companyId || !branchCode || !waiterPhone || typeof tipAmount !== 'number' || typeof rating !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const transaction = await addTransaction(companyId, branchCode, {
      waiterPhone,
      payerPhone: payerPhone || '',
      tipAmount,
      rating,
      comment: comment || '',
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
