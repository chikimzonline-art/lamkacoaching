import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaffOrAdmin } from '@/lib/auth';

// GET /api/bookings/pending-count (staff/admin)
export async function GET() {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

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