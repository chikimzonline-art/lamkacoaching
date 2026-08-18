import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPendingBookings, getPendingBookingCount } from '@/lib/db/queries/bookings';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      recentPayments,
      recentEnrollmentPayments,
      pendingBookingRequests,
      pendingBookingCount,
    ] = await Promise.all([
      db.payment.findMany({
        where: { status: 'completed' },
        orderBy: { receivedAt: 'desc' },
        take: 10,
        include: {
          student: { select: { name: true } },
          booking: { select: { type: true, cabin: { select: { cabinNum: true } } } },
        },
      }),
      db.enrollmentPayment.findMany({
        where: { status: 'completed' },
        orderBy: { receivedAt: 'desc' },
        take: 5,
        include: {
          student: { select: { name: true, phone: true } },
          enrollment: { select: { course: { select: { name: true, department: { select: { name: true } } } } } },
        },
      }),
      getPendingBookings(5),
      getPendingBookingCount(),
    ]);

    return NextResponse.json(
      {
        recentPayments,
        recentEnrollmentPayments,
        pendingBookingRequests,
        pendingBookingCount,
      },
      { headers: { 'Cache-Control': 'private, max-age=15' } }
    );
  } catch (error) {
    console.error('Error fetching recent dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
