import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/bookings/pending-count - Lightweight endpoint that returns only the
// count of pending booking requests. Used by the admin shell's sidebar badge
// polling so we don't have to run the full 15-query /api/dashboard endpoint
// every 30 seconds just to read one number.
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await db.booking.count({ where: { status: 'pending' } });
    return NextResponse.json(
      { count },
      { headers: { 'Cache-Control': 'private, max-age=10' } }
    );
  } catch (error) {
    console.error('Error fetching pending booking count:', error);
    return NextResponse.json({ error: 'Failed to fetch pending count' }, { status: 500 });
  }
}