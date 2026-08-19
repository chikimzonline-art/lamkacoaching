import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/courses - Public: list active courses categorized by department, enriched with batch schedules
export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const departments = await db.department.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
      include: {
        courses: {
          where: { status: { not: 'inactive' } },
          orderBy: { name: 'asc' },
          include: {
            batches: {
              where: {
                active: true,
                status: { not: 'closed' },
              },
              orderBy: { startDate: 'asc' },
              include: {
                _count: {
                  select: {
                    enrollments: {
                      where: { status: 'active' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format courses with batch metadata
    const formattedDepartments = departments
      .map((dept) => {
        const formattedCourses = dept.courses.map((course) => {
          const formattedDuration =
            course.durationValue && course.durationUnit
              ? `${course.durationValue} ${course.durationUnit}`
              : null;

          const formattedBatches = course.batches.map((b) => {
            const remainingSeats = Math.max(0, b.seats - b._count.enrollments);
            let calculatedStatus = b.status;
            if (b.status === 'enrolling' && remainingSeats <= 3 && remainingSeats > 0) {
              calculatedStatus = 'almost_full';
            } else if (remainingSeats === 0) {
              calculatedStatus = 'full';
            }

            return {
              id: b.id,
              batchName: b.batchName,
              startDate: b.startDate.toISOString(),
              endDate: b.endDate ? b.endDate.toISOString() : null,
              timing: b.timing,
              seats: remainingSeats,
              totalSeats: b.seats,
              status: calculatedStatus,
              description: b.description,
            };
          });

          // Upcoming batches starting today or future
          const upcomingBatches = formattedBatches.filter(
            (b) => new Date(b.startDate) >= startOfToday
          );

          // Ongoing batch currently in session
          const activeBatch = formattedBatches.find((b) => {
            const start = new Date(b.startDate);
            const end = b.endDate ? new Date(b.endDate) : null;
            return start <= now && (!end || end >= now);
          }) || null;

          const nextBatch = upcomingBatches.length > 0 ? upcomingBatches[0] : null;
          const isOngoing = activeBatch !== null;
          const hasOpenBatches = upcomingBatches.length > 0;

          return {
            id: course.id,
            name: course.name,
            departmentId: course.departmentId,
            departmentName: dept.name,
            durationValue: course.durationValue,
            durationUnit: course.durationUnit,
            duration: formattedDuration,
            totalFee: course.totalFee,
            description: course.description,
            status: course.status,
            batches: formattedBatches,
            nextBatch,
            activeBatch,
            isOngoing,
            hasOpenBatches,
          };
        });

        return {
          id: dept.id,
          name: dept.name,
          courses: formattedCourses,
        };
      })
      .filter((dept) => dept.courses.length > 0);

    return NextResponse.json(
      { departments: formattedDepartments },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180' } }
    );
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

