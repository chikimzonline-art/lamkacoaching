import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all achievement cards (admin)
export async function GET() {
  try {
    const achievements = await db.achievementCard.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST create new achievement card
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { badge, badgeColor, title, description, barColor, sortOrder, active } = body;
    
    if (!badge || !title || !description) {
      return NextResponse.json({ error: 'Badge, title, and description are required' }, { status: 400 });
    }

    const achievement = await db.achievementCard.create({
      data: { badge, badgeColor: badgeColor || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', title, description, barColor: barColor || 'from-cyan-500 to-sky-400', sortOrder: sortOrder || 0, active: active !== undefined ? active : true },
    });
    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement card:', error);
    return NextResponse.json({ error: 'Failed to create achievement card' }, { status: 500 });
  }
}

// PUT update achievement card
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const achievement = await db.achievementCard.update({
      where: { id },
      data,
    });
    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Error updating achievement card:', error);
    return NextResponse.json({ error: 'Failed to update achievement card' }, { status: 500 });
  }
}
