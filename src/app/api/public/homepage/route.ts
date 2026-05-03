import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [impactStats, achievementCards, successStories, testimonials, cabinCount] = await Promise.all([
      db.impactStat.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.achievementCard.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.successStory.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.testimonial.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.cabin.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      impactStats,
      achievementCards,
      successStories,
      testimonials,
      cabinCount,
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}
