import { NextResponse } from 'next/server';
import { restaurants } from '@/lib/restaurants';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

export async function POST(request: Request) {
  try {
    const { username, password, branch } = await request.json();

    if (!username || !password || !branch || !restaurants[branch]) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (
      username.trim().toLowerCase() !== DEFAULT_ADMIN_USERNAME ||
      password !== DEFAULT_ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
