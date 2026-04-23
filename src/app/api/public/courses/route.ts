import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/courses - Public: list active courses with departments
export async function GET() {
  try {
    const departments = await db.department.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
      include: {
        courses: {
          where: { status: 'active' },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            duration: true,
            totalFee: true,
            description: true,
          },
        },
      },
    });

    // Filter out departments with no active courses
    const filteredDepartments = departments.filter(
      (dept) => dept.courses.length > 0
    );

    return NextResponse.json({ departments: filteredDepartments });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
