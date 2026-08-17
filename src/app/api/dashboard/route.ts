import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/dashboard - Get dashboard stats
// All queries are independent and run in a single Promise.all batch,
// turning ~15 sequential network round-trips into one concurrent batch.
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      activeBookingStats,
      totalStudents,
      todayRevenueAgg,
      todayEnrollmentRevenueAgg,
      expiringSoon,
      enrollmentStats,
    ] = await db.$transaction([
      db.cabin.count({ where: { status: 'active' } }),
      db.booking.findMany({
        where: {
          type: 'exclusive',
          status: 'active',
          startDate: { lte: tomorrow },
          OR: [{ endDate: { gte: today } }, { endDate: null }],
        },
        include: { cabin: true, student: { select: { name: true } } },
      }),
      db.booking.findMany({
        where: {
          type: 'hourly',
          status: 'active',
          startDate: { gte: today, lt: tomorrow },
        },
        include: { cabin: true, student: { select: { name: true, phone: true } } },
        orderBy: { startTime: 'asc' },
      }),
      db.booking.aggregate({
        where: { status: 'active' },
        _count: { _all: true },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      db.student.count(),
      db.payment.aggregate({
        where: { receivedAt: { gte: today, lt: tomorrow }, status: 'completed' },
        _sum: { amount: true },
      }),
      db.enrollmentPayment.aggregate({
        where: { receivedAt: { gte: today, lt: tomorrow }, status: 'completed' },
        _sum: { amount: true },
      }),
      db.booking.findMany({
        where: {
          type: 'exclusive',
          status: 'active',
          endDate: { gte: today, lte: sevenDaysLater },
        },
        include: {
          student: { select: { name: true, phone: true } },
          cabin: { select: { cabinNum: true } },
        },
        orderBy: { endDate: 'asc' },
      }),
      db.enrollment.aggregate({
        where: { status: 'active' },
        _count: { _all: true },
        _sum: { totalFee: true, paidAmount: true },
      }),
    ]);

    const todayRevenue = todayRevenueAgg._sum.amount ?? 0;
    const todayEnrollmentRevenue = todayEnrollmentRevenueAgg._sum.amount ?? 0;
    const totalPending = (activeBookingStats._sum.totalAmount ?? 0) - (activeBookingStats._sum.paidAmount ?? 0);
    const occupiedCabins = exclusiveBookings.length;
    const availableCabins = totalCabins - occupiedCabins;
    const enrollmentOutstanding = (enrollmentStats._sum.totalFee ?? 0) - (enrollmentStats._sum.paidAmount ?? 0);
    const activeBookingsCount = activeBookingStats._count._all;
    const totalEnrollments = enrollmentStats._count._all;

    return NextResponse.json(
      {
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
          todayHourlyCount: todayHourlyBookings.length,
        },
        todayBookings: todayHourlyBookings,
        exclusiveBookings,
        expiringSoon,
      },
      { headers: { 'Cache-Control': 'private, max-age=15' } }
    );
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}