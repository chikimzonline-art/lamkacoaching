import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/batches — returns active upcoming batches with course & department details
export async function GET() {
  try {
    const now = new Date();
    // Start of current day in local/IST time to include batches starting today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const batches = await db.batch.findMany({
      where: {
        active: true,
        status: { in: ['enrolling', 'almost_full', 'full'] },
        startDate: { gte: startOfToday },
      },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
      include: {
        course: {
          include: {
            department: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'active' },
            },
          },
        },
      },
    });

    const formattedBatches = batches.map((b) => {
      const remainingSeats = Math.max(0, b.seats - b._count.enrollments);
      const duration =
        b.course.durationValue && b.course.durationUnit
          ? `${b.course.durationValue} ${b.course.durationUnit}`
          : 'Flexible';

      // Auto-flag almost_full if remaining seats drop to 3 or fewer
      let calculatedStatus = b.status;
      if (b.status === 'enrolling' && remainingSeats <= 3 && remainingSeats > 0) {
        calculatedStatus = 'almost_full';
      } else if (remainingSeats === 0) {
        calculatedStatus = 'full';
      }

      return {
        id: b.id,
        courseId: b.courseId,
        batchName: b.batchName,
        courseName: b.course.name,
        department: b.course.department.name,
        departmentId: b.course.department.id,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate ? b.endDate.toISOString() : null,
        timing: b.timing,
        seats: remainingSeats,
        totalSeats: b.seats,
        status: calculatedStatus,
        fee: b.course.totalFee,
        duration,
        description: b.description || b.course.description,
      };
    });

    return NextResponse.json(formattedBatches, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Failed to fetch public batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

