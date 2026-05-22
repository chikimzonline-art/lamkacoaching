import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Helper to verify auth


// PUT /api/achievement-cards/[id] - Update an achievement card
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { badge, badgeColor, title, description, barColor, sortOrder, active } = body;

    const achievementCard = await db.achievementCard.update({
      where: { id },
      data: {
        ...(badge !== undefined && { badge }),
        ...(badgeColor !== undefined && { badgeColor }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(barColor !== undefined && { barColor }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ achievementCard });
  } catch (error) {
    console.error('Error updating achievement card:', error);
    return NextResponse.json({ error: 'Failed to update achievement card' }, { status: 500 });
  }
}

// DELETE /api/achievement-cards/[id] - Delete an achievement card
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await db.achievementCard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement card:', error);
    return NextResponse.json({ error: 'Failed to delete achievement card' }, { status: 500 });
  }
}
