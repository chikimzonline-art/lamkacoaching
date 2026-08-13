import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!['daily', 'weekly', 'monthly', 'custom'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period. Use daily, weekly, monthly, or custom.' }, { status: 400 });
    }

    // Calculate date range based on period
    const now = new Date();
    let rangeStart: Date;
    let rangeEnd: Date = new Date(now);

    if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (startDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(now);
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      // Default ranges
      switch (period) {
        case 'daily':
          rangeStart = new Date(now);
          rangeStart.setHours(0, 0, 0, 0);
          break;
        case 'weekly': {
          rangeStart = new Date(now);
          const dayOfWeek = rangeStart.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          rangeStart.setDate(rangeStart.getDate() - daysToMonday);
          rangeStart.setHours(0, 0, 0, 0);
          break;
        }
        case 'monthly':
          rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
          rangeStart.setHours(0, 0, 0, 0);
          break;
        default:
          rangeStart = new Date(now);
          rangeStart.setHours(0, 0, 0, 0);
          break;
      }
    }

    rangeStart.setHours(0, 0, 0, 0);

    // Fetch all payments in the range (both booking and enrollment)
    const payments = await db.payment.findMany({
      where: {
        status: 'completed',
        receivedAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: {
        student: true,
        booking: {
          include: { cabin: true }
        },
      },
      orderBy: {
        receivedAt: 'asc',
      },
    });

    const enrollmentPayments = await db.enrollmentPayment.findMany({
      where: {
        status: 'completed',
        receivedAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: {
        student: true,
        enrollment: {
          select: { course: { select: { name: true } } },
        },
      },
      orderBy: {
        receivedAt: 'asc',
      },
    });

    // Combine all payments into a unified list for grouping
    type UnifiedPayment = {
      id: string;
      amount: number;
      receivedAt: Date;
      studentId: string;
      studentName: string;
      type: string;
      details: string;
      mode: string;
    };

    const allPayments: UnifiedPayment[] = [
      ...payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        receivedAt: p.receivedAt,
        studentId: p.studentId,
        studentName: p.student?.name || 'Unknown',
        type: 'Cabin Booking',
        details: `Cabin ${p.booking?.cabin?.cabinNum || 'N/A'} (Floor ${p.booking?.cabin?.floor || 'N/A'})`,
        mode: p.mode,
      })),
      ...enrollmentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        receivedAt: p.receivedAt,
        studentId: p.studentId,
        studentName: p.student?.name || 'Unknown',
        type: 'Course Enrollment',
        details: p.enrollment?.course?.name || 'N/A',
        mode: p.mode,
      })),
    ].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

    // Group payments by period
    const grouped: Record<string, number> = {};

    if (period === 'weekly') {
      // Group by day of the week for the week
      const current = new Date(rangeStart);
      while (current <= rangeEnd) {
        const key = current.toLocaleDateString('en-IN', { weekday: 'short' });
        grouped[key] = 0;
        current.setDate(current.getDate() + 1);
      }
      for (const payment of allPayments) {
        const paymentDate = new Date(payment.receivedAt);
        const key = paymentDate.toLocaleDateString('en-IN', { weekday: 'short' });
        if (grouped[key] !== undefined) {
          grouped[key] += payment.amount;
        }
      }
    } else if (period === 'monthly' || period === 'custom') {
      // Group by specific day (e.g., 1-Jul, 2-Jul)
      const current = new Date(rangeStart);
      while (current <= rangeEnd) {
        const key = current.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (!grouped[key]) grouped[key] = 0;
        current.setDate(current.getDate() + 1);
      }
      for (const payment of allPayments) {
        const paymentDate = new Date(payment.receivedAt);
        const key = paymentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (grouped[key] !== undefined) {
          grouped[key] += payment.amount;
        } else {
           grouped[key] = payment.amount; // fallback if it somehow falls out of loop
        }
      }
    } else if (period === 'daily') {
      // We don't really need chart grouping for daily if it's a table,
      // but we can group by hour if we wanted to. We'll just provide the flat list.
    }

    const labels = Object.keys(grouped);
    const revenue = Object.values(grouped); // Return paise directly

    // Calculate totals
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const paymentCount = allPayments.length;

    // Top students
    const studentTotals: Record<string, { name: string; totalPaid: number }> = {};
    for (const payment of allPayments) {
      const studentName = payment.studentName;
      if (!studentTotals[payment.studentId]) {
        studentTotals[payment.studentId] = { name: studentName, totalPaid: 0 };
      }
      studentTotals[payment.studentId].totalPaid += payment.amount;
    }

    const topStudents = Object.values(studentTotals)
      .map((s) => ({ name: s.name, totalPaid: s.totalPaid }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);

    // Format the paymentsList for daily view
    const paymentsList = allPayments.map(p => ({
      ...p
    }));

    return NextResponse.json({
      labels,
      revenue,
      totalRevenue,
      paymentCount,
      topStudents,
      paymentsList,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports data' }, { status: 500 });
  }
}

