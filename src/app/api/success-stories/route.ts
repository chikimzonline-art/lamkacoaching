import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { revalidateHome } from '@/lib/revalidate';

// Helper to verify auth


// GET /api/success-stories - List all success stories ordered by sortOrder
export async function GET() {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const successStories = await db.successStory.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ successStories });
  } catch (error) {
    console.error('Error fetching success stories:', error);
    return NextResponse.json({ error: 'Failed to fetch success stories' }, { status: 500 });
  }
}

// POST /api/success-stories - Create a new success story
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, exam, quote, result, initials, gradient, sortOrder, active } = body;

    if (!name || !exam || !quote) {
      return NextResponse.json(
        { error: 'Name, exam, and quote are required' },
        { status: 400 }
      );
    }

    const successStory = await db.successStory.create({
      data: {
        name,
        exam,
        quote,
        result: result ?? '',
        initials: initials ?? name.slice(0, 2).toUpperCase(),
        gradient: gradient ?? 'from-cyan-500 to-sky-500',
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });

    revalidateHome();
    return NextResponse.json({ successStory }, { status: 201 });
  } catch (error) {
    console.error('Error creating success story:', error);
    return NextResponse.json({ error: 'Failed to create success story' }, { status: 500 });
  }
}
