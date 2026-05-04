import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/public/impact - Return active impact stats and achievement cards
export async function GET() {
  try {
    const [impactStats, achievementCards] = await Promise.all([
      db.impactStat.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.achievementCard.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return NextResponse.json({ impactStats, achievementCards });
  } catch (error) {
    console.error('Error fetching public impact data:', error);
    return NextResponse.json({ impactStats: [], achievementCards: [] }, { status: 500 });
  }
}
