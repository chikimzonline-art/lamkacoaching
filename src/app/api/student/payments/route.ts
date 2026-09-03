import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch pending enrollments
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        course: { select: { id: true, name: true, department: { select: { name: true } } } },
      },
    });

    const pendingEnrollments = enrollments.filter(
      (e) => e.status === 'pending_payment' || e.totalFee - e.paidAmount > 0
    ).map(e => ({
      id: e.id,
      type: 'enrollment',
      itemId: e.course.id,
      itemName: e.course.name,
      departmentName: e.course.department?.name,
      totalAmount: e.totalFee,
      paidAmount: e.paidAmount,
      balance: e.totalFee - e.paidAmount,
      status: e.status,
    }));

    // 2. Fetch pending bookings
    const bookings = await db.booking.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        cabin: { select: { id: true, cabinNum: true, floor: true } },
      },
    });

    const pendingBookings = bookings.filter(
      (b) => (b.totalAmount - b.paidAmount > 0)
    ).map(b => ({
      id: b.id,
      type: 'booking',
      itemId: b.cabin.id,
      itemName: `Cabin ${b.cabin.cabinNum} (Floor ${b.cabin.floor})`,
      bookingType: b.type,
      totalAmount: b.totalAmount,
      paidAmount: b.paidAmount,
      balance: b.totalAmount - b.paidAmount,
      status: b.status,
    }));

    // 3. Fetch unified past payments (both booking and enrollment)
    const [bookingPayments, enrollmentPayments] = await db.$transaction([
      db.payment.findMany({
        where: { studentId: user.id },
        orderBy: { receivedAt: 'desc' },
        include: {
          booking: {
            select: {
              type: true,
              cabin: { select: { cabinNum: true, floor: true } },
            },
          },
        },
      }),
      db.enrollmentPayment.findMany({
        where: { studentId: user.id },
        orderBy: { receivedAt: 'desc' },
        include: {
          enrollment: {
            select: {
              course: { select: { name: true, department: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    // Normalize unified payments
    const pastPayments = [
      ...bookingPayments.map((p) => ({
        id: p.id,
        type: 'booking' as const,
        amount: p.amount,
        mode: p.mode,
        status: p.status,
        date: p.receivedAt,
        receiptNo: p.receiptNo,
        itemName: `Cabin ${p.booking?.cabin.cabinNum} (Floor ${p.booking?.cabin.floor})`,
        itemDetail: p.booking?.type.replace('_', ' ').toUpperCase() + ' BOOKING',
      })),
      ...enrollmentPayments.map((p) => ({
        id: p.id,
        type: 'enrollment' as const,
        amount: p.amount,
        mode: p.mode,
        status: p.status,
        date: p.receivedAt,
        receiptNo: p.receiptNo,
        itemName: p.enrollment?.course.name,
        itemDetail: p.enrollment?.course.department?.name || 'Course Fee',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      pendingDues: [...pendingEnrollments, ...pendingBookings],
      pastPayments,
    });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return NextResponse.json({ error: 'Failed to fetch student payments' }, { status: 500 });
  }
}
