import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET — public endpoint to fetch active feature cards
export async function GET() {
  try {
    const cards = await db.featureCard.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        icon: true,
        linkText: true,
        linkHref: true,
        sortOrder: true,
      },
    });
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('GET /api/public/feature-cards error:', error);
    return NextResponse.json({ error: 'Failed to fetch feature cards' }, { status: 500 });
  }
}
