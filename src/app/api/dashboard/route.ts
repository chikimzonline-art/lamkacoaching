import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Helper to verify auth


// GET /api/dashboard - Get dashboard stats
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const onlyCount = searchParams.get('onlyCount') === 'true';

    if (onlyCount) {
      const pendingBookingCount = await db.booking.count({ where: { status: 'pending' } });
      return NextResponse.json({ pendingBookingCount });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [
      totalCabins,
      exclusiveBookings,
      todayHourlyBookings,
      activeBookingsCount,
      totalStudents,
      todayPaymentsSum,
      todayEnrollmentPaymentsSum,
      bookingsSums,
      expiringSoon,
      recentPayments,
      totalEnrollments,
      enrollmentFees,
      recentEnrollmentPayments,
      pendingBookingRequests,
      pendingBookingCount
    ] = await Promise.all([
      // 1. Total cabins
      db.cabin.count({ where: { status: 'active' } }),

      // 2. Active reserved bookings (occupying cabins)
      db.booking.findMany({
        where: {
          type: 'reserved',
          status: 'active',
          startDate: { lte: tomorrow },
          OR: [{ endDate: { gte: today } }, { endDate: null }],
        },
        include: { cabin: true, student: { select: { name: true } } },
      }),

      // 3. Today's shift bookings
      db.booking.findMany({
        where: {
          type: 'shift',
          status: 'active',
          startDate: { gte: today, lt: tomorrow },
        },
        include: { cabin: true, student: { select: { name: true, phone: true } } },
        orderBy: { startTime: 'asc' },
      }),

      // 4. Total active bookings
      db.booking.count({ where: { status: 'active' } }),

      // 5. Total students
      db.student.count(),

      // 6. Today's revenue (from booking payments)
      db.payment.aggregate({
        where: {
          receivedAt: { gte: today, lt: tomorrow },
          status: 'completed',
        },
        _sum: { amount: true },
      }),

      // 7. Today's enrollment payment revenue
      db.enrollmentPayment.aggregate({
        where: {
          receivedAt: { gte: today, lt: tomorrow },
          status: 'completed',
        },
        _sum: { amount: true },
      }),

      // 8. Total pending amount (across all active bookings)
      db.booking.aggregate({
        where: { status: 'active' },
        _sum: { totalAmount: true, paidAmount: true },
      }),

      // 9. Expiring soon (reserved bookings expiring in next 7 days)
      db.booking.findMany({
        where: {
          type: 'reserved',
          status: 'active',
          endDate: { gte: today, lte: sevenDaysLater },
        },
        include: {
          student: { select: { name: true, phone: true } },
          cabin: { select: { cabinNum: true } },
        },
        orderBy: { endDate: 'asc' },
      }),

      // 10. Recent payments (last 10)
      db.payment.findMany({
        where: { status: 'completed' },
        orderBy: { receivedAt: 'desc' },
        take: 10,
        include: {
          student: { select: { name: true } },
          booking: { select: { type: true, cabin: { select: { cabinNum: true } } } },
        },
      }),

      // 11. Enrollment stats
      db.enrollment.count({ where: { status: 'active' } }),
      db.enrollment.aggregate({
        where: { status: 'active' },
        _sum: { totalFee: true, paidAmount: true },
      }),

      // 12. Recent enrollment payments (last 5)
      db.enrollmentPayment.findMany({
        where: { status: 'completed' },
        orderBy: { receivedAt: 'desc' },
        take: 5,
        include: {
          student: { select: { name: true, phone: true } },
          enrollment: { select: { course: { select: { name: true, department: { select: { name: true } } } } } },
        },
      }),

      // 13. Pending booking requests
      db.booking.findMany({
        where: { status: 'pending' },
        include: {
          student: { select: { name: true, phone: true } },
          cabin: { select: { cabinNum: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // 14. Pending booking count
      db.booking.count({ where: { status: 'pending' } }),
    ]);

    const todayRevenue = todayPaymentsSum._sum.amount || 0;
    const todayEnrollmentRevenue = todayEnrollmentPaymentsSum._sum.amount || 0;
    const totalPending = (bookingsSums._sum.totalAmount || 0) - (bookingsSums._sum.paidAmount || 0);
    const enrollmentOutstanding = (enrollmentFees._sum.totalFee || 0) - (enrollmentFees._sum.paidAmount || 0);

    // Occupied cabins (reserved) count
    const occupiedCabins = exclusiveBookings.length;
    const availableCabins = totalCabins - occupiedCabins;

    return NextResponse.json({
      stats: {
        totalCabins,
        availableCabins,
        occupiedCabins,
        totalStudents,
        activeBookingsCount,
        todayRevenue,
        todayEnrollmentRevenue,
        totalPending,
        totalEnrollments,
        enrollmentOutstanding,
        todayShiftCount: todayHourlyBookings.length,
      },
      todayBookings: todayHourlyBookings,
      exclusiveBookings,
      expiringSoon,
      recentPayments,
      recentEnrollmentPayments,
      pendingBookingRequests,
      pendingBookingCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
