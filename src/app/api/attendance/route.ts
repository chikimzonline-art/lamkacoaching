import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Helper to verify auth


// GET /api/attendance - List attendance records
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};
    if (bookingId) where.bookingId = bookingId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    const attendance = await db.attendance.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { date: 'desc' },
      include: {
        booking: {
          include: {
            student: { select: { id: true, name: true, phone: true } },
            cabin: { select: { cabinNum: true } },
          },
        },
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST /api/attendance - Check in/out
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    if (action === 'checkin') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if already checked in today
      const existing = await db.attendance.findFirst({
        where: {
          bookingId,
          date: { gte: today, lt: tomorrow },
          checkIn: { not: null },
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
      }

      const attendance = await db.attendance.create({
        data: {
          bookingId,
          date: today,
          checkIn: new Date(),
        },
        include: {
          booking: {
            include: {
              student: { select: { name: true } },
              cabin: { select: { cabinNum: true } },
            },
          },
        },
      });

      return NextResponse.json({ attendance });

    } else if (action === 'checkout') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await db.attendance.findFirst({
        where: {
          bookingId,
          date: { gte: today, lt: tomorrow },
          checkOut: null,
        },
      });

      if (!existing) {
        return NextResponse.json({ error: 'No active check-in found' }, { status: 400 });
      }

      const attendance = await db.attendance.update({
        where: { id: existing.id },
        data: { checkOut: new Date() },
        include: {
          booking: {
            include: {
              student: { select: { name: true } },
              cabin: { select: { cabinNum: true } },
            },
          },
        },
      });

      return NextResponse.json({ attendance });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing attendance:', error);
    return NextResponse.json({ error: 'Failed to process attendance' }, { status: 500 });
  }
}
