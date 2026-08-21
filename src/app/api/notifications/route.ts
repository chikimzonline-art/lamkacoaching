import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/notifications — list notifications for the logged in student
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const showAll = request.nextUrl.searchParams.get('all') === 'true';

    const whereClause = showAll
      ? { studentId: user.id }
      : { studentId: user.id, read: false };

    const [notifications, unreadCount] = await db.$transaction([
      db.studentNotification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      db.studentNotification.count({
        where: { studentId: user.id, read: false }
      })
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications — mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body; // optional array of specific ids to mark read

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await db.studentNotification.updateMany({
        where: {
          studentId: user.id,
          id: { in: ids },
          read: false
        },
        data: { read: true }
      });
    } else {
      // Mark all as read
      await db.studentNotification.updateMany({
        where: {
          studentId: user.id,
          read: false
        },
        data: { read: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notifications read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications read' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications — delete/dismiss notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await db.studentNotification.deleteMany({
        where: {
          studentId: user.id,
          id: { in: ids }
        }
      });
    } else {
      // Delete all notifications for this student
      await db.studentNotification.deleteMany({
        where: {
          studentId: user.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
