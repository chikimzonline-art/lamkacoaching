import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStudent } from '@/lib/student-auth';

// GET /api/notifications — list notifications for the logged in student
export async function GET() {
  try {
    const { student } = await requireStudent();

    const [notifications, unreadCount] = await db.$transaction([
      db.studentNotification.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 20 // limit to last 20
      }),
      db.studentNotification.count({
        where: { studentId: student.id, read: false }
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

// POST /api/notifications/mark-read — mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const { student } = await requireStudent();
    const body = await request.json();
    const { ids } = body; // optional array of specific ids to mark read

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await db.studentNotification.updateMany({
        where: {
          studentId: student.id,
          id: { in: ids },
          read: false
        },
        data: { read: true }
      });
    } else {
      // Mark all as read
      await db.studentNotification.updateMany({
        where: {
          studentId: student.id,
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
