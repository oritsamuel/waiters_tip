import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Hardcoded admin credentials per company.
// Key format: "companyId_branchCode"
const ADMIN_CREDENTIALS: Record<string, string> = {
  // "50301_MAIN": "secret123"
};

const DEFAULT_ADMIN_PASSWORD = 'admin123';

export async function POST(request: Request) {
  try {
    const { companyId, branchCode, password } = await request.json();

    if (!companyId || !branchCode || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // 1. Check if this company/branch exists in the database
    const db = await getDb();
    const key = `${companyId}_${branchCode}`;

    if (!db[key]) {
      return NextResponse.json({ error: 'Company ID or Branch Code not found.' }, { status: 401 });
    }

    // 2. Check password
    const expectedPassword = ADMIN_CREDENTIALS[key] ?? DEFAULT_ADMIN_PASSWORD;

    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
