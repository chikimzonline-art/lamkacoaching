import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { revalidateHome } from '@/lib/revalidate';

// GET all success stories (admin)
export async function GET() {
  try {
    const stories = await db.successStory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

// POST create new story
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, exam, quote, result, initials, gradient, sortOrder, active } = body;
    
    if (!name || !exam || !quote || !result) {
      return NextResponse.json({ error: 'Name, exam, quote, and result are required' }, { status: 400 });
    }

    const story = await db.successStory.create({
      data: { name, exam, quote, result, initials: initials || name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), gradient: gradient || 'from-cyan-500 to-sky-500', sortOrder: sortOrder || 0, active: active !== undefined ? active : true },
    });
    revalidateHome();
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}

// PUT update story
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const story = await db.successStory.update({
      where: { id },
      data,
    });
    revalidateHome();
    return NextResponse.json({ story });
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}
