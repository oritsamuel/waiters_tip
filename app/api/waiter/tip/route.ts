import { NextRequest, NextResponse } from 'next/server';
import { HULUBEJE_TIP_URL, HULUBEJE_API_KEY } from '@/lib/config';

/**
 * The payment API key expected in the X-Api-Key header from the caller.
 * In production this should come from an environment variable — for now it
 * matches the shared Hulubeje key so existing callers keep working.
 */
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || HULUBEJE_API_KEY;

/**
 * POST /api/waiter/tip
 *
 * Records a tip. Protected by a payment API key sent via the X-Api-Key header.
 * This is a server-side proxy — the browser should never call the external API
 * directly. The frontend calls this route, and this route forwards to Hulubeje
 * with the real API key.
 */
export async function POST(request: NextRequest) {
  try {
    // --- API-key authentication ---
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== PAYMENT_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid payment API key.' },
        { status: 401 },
      );
    }

    // --- Parse and validate body ---
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Malformed or missing request body.' },
        { status: 400 },
      );
    }

    const {
      waiterPhoneNumber,
      payerPhoneNumber,
      companyId,
      branchId,
      branchCode,
      tipAmount,
      rating,
      review,
      referenceData,
    } = body;

    if (!waiterPhoneNumber || !payerPhoneNumber || !companyId || tipAmount == null || rating == null) {
      return NextResponse.json(
        {
          success: false,
          message:
            'waiterPhoneNumber, payerPhoneNumber, companyId, tipAmount, and rating are required.',
        },
        { status: 400 },
      );
    }

    // --- Forward to external API ---
    const response = await fetch(HULUBEJE_TIP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HULUBEJE_API_KEY,
      },
      body: JSON.stringify({
        waiterPhoneNumber,
        payerPhoneNumber,
        companyId,
        ...(branchId != null && { branchId }),
        ...(branchCode != null && { branchCode }),
        tipAmount,
        rating,
        ...(review != null && { review }),
        ...(referenceData != null && { referenceData }),
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Failed to record tip.';
      return NextResponse.json(
        { success: false, message },
        { status: response.status || 500 },
      );
    }

    // Return the repository result directly
    return NextResponse.json(payload ?? { success: true, message: 'Tip recorded successfully.' });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
