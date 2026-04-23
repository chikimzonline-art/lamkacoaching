import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/departments
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const departments = await db.department.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { courses: { where: { status: 'active' } } } },
      },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST /api/departments
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, id, name, status } = body;

    if (action === 'create') {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
      }
      const department = await db.department.create({
        data: { name: name.trim() },
      });
      return NextResponse.json({ department });

    } else if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const department = await db.department.update({
        where: { id },
        data: {
          name: name?.trim() || undefined,
          status: status || undefined,
        },
      });
      return NextResponse.json({ department });

    } else if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const courseCount = await db.course.count({ where: { departmentId: id, status: 'active' } });
      if (courseCount > 0) {
        return NextResponse.json({ error: `Cannot delete: department has ${courseCount} active course(s)` }, { status: 400 });
      }
      await db.department.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to process request';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 409 });
    }
    console.error('Error processing department:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
