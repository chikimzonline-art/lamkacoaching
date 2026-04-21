import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper to verify auth
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

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

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period. Use daily, weekly, or monthly.' }, { status: 400 });
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
          rangeStart.setDate(rangeStart.getDate() - 29);
          rangeStart.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          rangeStart = new Date(now);
          rangeStart.setDate(rangeStart.getDate() - 83); // ~12 weeks
          rangeStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          rangeStart = new Date(now);
          rangeStart.setMonth(rangeStart.getMonth() - 11);
          rangeStart.setDate(1);
          rangeStart.setHours(0, 0, 0, 0);
          break;
      }
    }

    rangeStart.setHours(0, 0, 0, 0);

    // Fetch all payments in the range
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
        booking: true,
      },
      orderBy: {
        receivedAt: 'asc',
      },
    });

    // Group payments by period
    const grouped: Record<string, number> = {};

    switch (period) {
      case 'daily': {
        // Generate all days in range
        const current = new Date(rangeStart);
        while (current <= rangeEnd) {
          const key = current.toISOString().split('T')[0];
          grouped[key] = 0;
          current.setDate(current.getDate() + 1);
        }
        // Fill in payment data
        for (const payment of payments) {
          const key = new Date(payment.receivedAt).toISOString().split('T')[0];
          grouped[key] = (grouped[key] || 0) + payment.amount;
        }
        break;
      }
      case 'weekly': {
        // Group by week start (Monday)
        const current = new Date(rangeStart);
        // Go back to the nearest Monday
        const dayOfWeek = current.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        current.setDate(current.getDate() - daysToMonday);

        while (current <= rangeEnd) {
          const weekEnd = new Date(current);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const label = `${current.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
          grouped[label] = 0;
          const weekStart = new Date(current);
          weekStart.setHours(0, 0, 0, 0);
          const weekEndDay = new Date(current);
          weekEndDay.setDate(weekEndDay.getDate() + 6);
          weekEndDay.setHours(23, 59, 59, 999);
          for (const payment of payments) {
            const paymentDate = new Date(payment.receivedAt);
            if (paymentDate >= weekStart && paymentDate <= weekEndDay) {
              grouped[label] = (grouped[label] || 0) + payment.amount;
            }
          }
          current.setDate(current.getDate() + 7);
        }
        break;
      }
      case 'monthly': {
        // Generate all months in range
        const current = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
        const endMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
        while (current <= endMonth) {
          const key = current.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          grouped[key] = 0;
          current.setMonth(current.getMonth() + 1);
        }
        // Fill in payment data
        for (const payment of payments) {
          const paymentDate = new Date(payment.receivedAt);
          const key = paymentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          grouped[key] = (grouped[key] || 0) + payment.amount;
        }
        break;
      }
    }

    const labels = Object.keys(grouped);
    const revenue = Object.values(grouped).map((v) => v / 100); // Convert paise to rupees

    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0) / 100;
    const paymentCount = payments.length;

    // Top students
    const studentTotals: Record<string, { name: string; totalPaid: number }> = {};
    for (const payment of payments) {
      const studentName = payment.student.name;
      if (!studentTotals[payment.studentId]) {
        studentTotals[payment.studentId] = { name: studentName, totalPaid: 0 };
      }
      studentTotals[payment.studentId].totalPaid += payment.amount;
    }

    const topStudents = Object.values(studentTotals)
      .map((s) => ({ name: s.name, totalPaid: s.totalPaid / 100 }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);

    return NextResponse.json({
      labels,
      revenue,
      totalRevenue,
      paymentCount,
      topStudents,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports data' }, { status: 500 });
  }
}
