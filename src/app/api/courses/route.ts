import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';



// GET /api/courses
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    else where.status = 'active';

    const courses = await db.course.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { name: 'asc' },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { enrollments: { where: { status: 'active' } } } },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST /api/courses
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, id, name, departmentId, duration, totalFee, description, status } = body;

    if (action === 'create') {
      if (!name?.trim() || !departmentId || !totalFee) {
        return NextResponse.json({ error: 'Name, department, and total fee are required' }, { status: 400 });
      }
      const course = await db.course.create({
        data: {
          name: name.trim(),
          departmentId,
          duration: duration?.trim() || null,
          totalFee: Math.round(Number(totalFee) * 100), // convert to paise
          description: description?.trim() || null,
        },
        include: { department: { select: { id: true, name: true } } },
      });
      return NextResponse.json({ course });

    } else if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const course = await db.course.update({
        where: { id },
        data: {
          name: name?.trim() || undefined,
          departmentId: departmentId || undefined,
          duration: duration !== undefined ? (duration?.trim() || null) : undefined,
          totalFee: totalFee !== undefined ? Math.round(Number(totalFee) * 100) : undefined,
          description: description !== undefined ? (description?.trim() || null) : undefined,
          status: status || undefined,
        },
        include: { department: { select: { id: true, name: true } } },
      });
      return NextResponse.json({ course });

    } else if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const enrollmentCount = await db.enrollment.count({ where: { courseId: id, status: 'active' } });
      if (enrollmentCount > 0) {
        return NextResponse.json({ error: `Cannot delete: course has ${enrollmentCount} active enrollment(s)` }, { status: 400 });
      }
      await db.course.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing course:', error);
    return NextResponse.json({ error: 'Failed to process course request' }, { status: 500 });
  }
}
