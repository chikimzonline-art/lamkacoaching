import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaffOrAdmin } from '@/lib/auth';

// GET /api/notices - list all notices (staff/admin)
export async function GET() {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const notices = await db.notice.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

// POST /api/notices - CRUD notices (staff/admin)
export async function POST(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, id, title, content, pinned, status } = body;

    if (action === 'create') {
      if (!title?.trim() || !content?.trim()) {
        return NextResponse.json(
          { error: 'Title and content are required' },
          { status: 400 }
        );
      }
      const notice = await db.notice.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          pinned: pinned || false,
          status: status || 'published',
        },
      });

      // Broadcast push notification to all student devices
      if (notice.status === 'published') {
        import('@/lib/fcm-server').then((fcm) => {
          fcm.broadcastNoticeNotification({
            title: `📢 ${notice.pinned ? 'Urgent Notice' : 'Notice'}: ${notice.title}`,
            body: notice.content.length > 120 ? `${notice.content.slice(0, 117)}...` : notice.content,
            link: '/dashboard/notices',
            data: { noticeId: notice.id },
          }).catch((e) => console.error('Failed to broadcast push notification', e));
        });
      }

      return NextResponse.json({ notice });

    } else if (action === 'update') {
      if (!id)
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const notice = await db.notice.update({
        where: { id },
        data: {
          title: title?.trim() || undefined,
          content: content?.trim() || undefined,
          pinned: pinned !== undefined ? pinned : undefined,
          status: status || undefined,
        },
      });
      return NextResponse.json({ notice });

    } else if (action === 'delete') {
      if (!id)
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      await db.notice.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing notice:', error);
    return NextResponse.json(
      { error: 'Failed to process notice' },
      { status: 500 }
    );
  }
}
