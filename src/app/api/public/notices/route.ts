import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/notices - Public: list published notices
export async function GET() {
  try {
    const notices = await db.notice.findMany({
      where: { status: 'published' },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return NextResponse.json({ notices });
  } catch (error) {
    console.error('Error fetching public notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}
