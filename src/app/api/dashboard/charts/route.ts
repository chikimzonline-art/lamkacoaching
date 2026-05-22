import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [enrollments, departments, payments] = await Promise.all([
      // 1. Monthly Enrollments (last 6 months)
      db.enrollment.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),

      // 2. Students by Department
      db.department.findMany({
        where: { status: 'active' },
        include: {
          courses: {
            where: { status: 'active' },
            include: { _count: { select: { enrollments: true } } },
          },
        },
      }),

      // 3. Revenue Trend (last 6 months)
      db.enrollmentPayment.findMany({
        where: { receivedAt: { gte: sixMonthsAgo } },
        select: { amount: true, receivedAt: true },
      }),
    ]);


    const monthlyEnrollments: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = enrollments.filter(
        (e) => e.createdAt >= month && e.createdAt <= monthEnd
      ).length;
      monthlyEnrollments.push({
        month: month.toLocaleDateString('en-IN', { month: 'short' }),
        enrollments: count,
      });
    }

    const COLORS = ['#06b6d4', '#0ea5e9', '#14b8a6', '#38bdf8', '#22d3ee', '#67e8f9'];
    const studentsByDepartment = departments.map((dept, index) => ({
      name: dept.name,
      value: dept.courses.reduce((sum, c) => sum + c._count.enrollments, 0),
      color: COLORS[index % COLORS.length],
    }));

    const revenueTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const total = payments
        .filter((p) => p.receivedAt >= month && p.receivedAt <= monthEnd)
        .reduce((sum, p) => sum + p.amount, 0);
      revenueTrend.push({
        month: month.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: total / 100, // convert paise to rupees
      });
    }

    return NextResponse.json({
      monthlyEnrollments,
      studentsByDepartment,
      revenueTrend,
    });
  } catch (error) {
    console.error('Dashboard charts API error:', error);
    return NextResponse.json(
      { error: 'Failed to load chart data' },
      { status: 500 }
    );
  }
}
