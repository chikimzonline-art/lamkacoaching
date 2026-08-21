import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// POST /api/notifications/mark-read — mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body;

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
