import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/public/stories - Return active success stories
export async function GET() {
  try {
    const successStories = await db.successStory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        achievement: true,
        batch: true,
      },
    });

    return NextResponse.json(
      { successStories },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error) {
    console.error('Error fetching public stories data:', error);
    return NextResponse.json({ successStories: [] }, { status: 500 });
  }
}
