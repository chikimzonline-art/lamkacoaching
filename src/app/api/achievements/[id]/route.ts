import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.achievementCard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement card:', error);
    return NextResponse.json({ error: 'Failed to delete achievement card' }, { status: 500 });
  }
}
