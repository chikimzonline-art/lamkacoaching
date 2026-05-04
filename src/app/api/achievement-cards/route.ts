import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper to verify auth
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/achievement-cards - List all achievement cards ordered by sortOrder
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievementCards = await db.achievementCard.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ achievementCards });
  } catch (error) {
    console.error('Error fetching achievement cards:', error);
    return NextResponse.json({ error: 'Failed to fetch achievement cards' }, { status: 500 });
  }
}

// POST /api/achievement-cards - Create a new achievement card
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { badge, badgeColor, title, description, barColor, sortOrder, active } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const achievementCard = await db.achievementCard.create({
      data: {
        badge: badge ?? '',
        badgeColor: badgeColor ?? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        title,
        description,
        barColor: barColor ?? 'from-cyan-500 to-sky-400',
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });

    return NextResponse.json({ achievementCard }, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement card:', error);
    return NextResponse.json({ error: 'Failed to create achievement card' }, { status: 500 });
  }
}
