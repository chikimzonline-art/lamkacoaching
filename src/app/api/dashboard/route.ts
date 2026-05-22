import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Helper to verify auth


// GET /api/dashboard - Get dashboard stats
export async function GET() {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total cabins
    const totalCabins = await db.cabin.count({ where: { status: 'active' } });

    // Active exclusive bookings (occupying cabins)
    const exclusiveBookings = await db.booking.findMany({
      where: {
        type: 'exclusive',
        status: 'active',
        startDate: { lte: tomorrow },
        OR: [{ endDate: { gte: today } }, { endDate: null }],
      },
      include: { cabin: true, student: { select: { name: true } } },
    });

    // Today's hourly bookings
    const todayHourlyBookings = await db.booking.findMany({
      where: {
        type: 'hourly',
        status: 'active',
        startDate: { gte: today, lt: tomorrow },
      },
      include: { cabin: true, student: { select: { name: true, phone: true } } },
      orderBy: { startTime: 'asc' },
    });

    // Total active bookings
    const activeBookingsCount = await db.booking.count({ where: { status: 'active' } });

    // Total students
    const totalStudents = await db.student.count();

    // Today's revenue (from booking payments)
    const todayPayments = await db.payment.findMany({
      where: {
        receivedAt: { gte: today, lt: tomorrow },
        status: 'completed',
      },
    });
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    // Today's enrollment payment revenue
    const todayEnrollmentPayments = await db.enrollmentPayment.findMany({
      where: {
        receivedAt: { gte: today, lt: tomorrow },
        status: 'completed',
      },
    });
    const todayEnrollmentRevenue = todayEnrollmentPayments.reduce((sum, p) => sum + p.amount, 0);

    // Total pending amount (across all active bookings)
    const activeBookings = await db.booking.findMany({
      where: { status: 'active' },
      select: { totalAmount: true, paidAmount: true },
    });
    const totalPending = activeBookings.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

    // Expiring soon (exclusive bookings expiring in next 7 days)
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const expiringSoon = await db.booking.findMany({
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
    });

    // Occupied cabins (exclusive) count
    const occupiedCabins = exclusiveBookings.length;
    const availableCabins = totalCabins - occupiedCabins;

    // Recent payments (last 10)
    const recentPayments = await db.payment.findMany({
      where: { status: 'completed' },
      orderBy: { receivedAt: 'desc' },
      take: 10,
      include: {
        student: { select: { name: true } },
        booking: { select: { type: true, cabin: { select: { cabinNum: true } } } },
      },
    });

    // Enrollment stats
    const totalEnrollments = await db.enrollment.count({ where: { status: 'active' } });
    const enrollmentFees = await db.enrollment.aggregate({
      where: { status: 'active' },
      _sum: { totalFee: true, paidAmount: true },
    });
    const enrollmentOutstanding = (enrollmentFees._sum.totalFee || 0) - (enrollmentFees._sum.paidAmount || 0);

    // Recent enrollment payments (last 5)
    const recentEnrollmentPayments = await db.enrollmentPayment.findMany({
      where: { status: 'completed' },
      orderBy: { receivedAt: 'desc' },
      take: 5,
      include: {
        student: { select: { name: true, phone: true } },
        enrollment: { select: { course: { select: { name: true, department: { select: { name: true } } } } } },
      },
    });

    // Pending booking requests
    const pendingBookingRequests = await db.booking.findMany({
      where: { status: 'pending' },
      include: {
        student: { select: { name: true, phone: true } },
        cabin: { select: { cabinNum: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const pendingBookingCount = await db.booking.count({ where: { status: 'pending' } });

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
        todayHourlyCount: todayHourlyBookings.length,
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
