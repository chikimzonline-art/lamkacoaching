import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Helper to verify auth


// PUT /api/success-stories/[id] - Update a success story
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
    const { name, exam, quote, result, initials, color, sortOrder, active } = body;

    const successStory = await db.successStory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(exam !== undefined && { exam }),
        ...(quote !== undefined && { quote }),
        ...(result !== undefined && { result }),
        ...(initials !== undefined && { initials }),
        ...(color !== undefined && { color }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ successStory });
  } catch (error) {
    console.error('Error updating success story:', error);
    return NextResponse.json({ error: 'Failed to update success story' }, { status: 500 });
  }
}

// DELETE /api/success-stories/[id] - Delete a success story
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
    await db.successStory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting success story:', error);
    return NextResponse.json({ error: 'Failed to delete success story' }, { status: 500 });
  }
}
