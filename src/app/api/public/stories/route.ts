import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/public/stories - Return active success stories and testimonials
export async function GET() {
  try {
    const [successStories, testimonials] = await Promise.all([
      db.successStory.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.testimonial.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return NextResponse.json({ successStories, testimonials });
  } catch (error) {
    console.error('Error fetching public stories data:', error);
    return NextResponse.json({ successStories: [], testimonials: [] }, { status: 500 });
  }
}
