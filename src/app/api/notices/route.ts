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

// GET /api/notices - Admin: list all notices
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

// POST /api/notices - Admin: CRUD notices
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
