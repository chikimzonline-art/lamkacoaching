import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'active must be a boolean' },
        { status: 400 }
      );
    }

    const subscriber = await db.newsletterSubscriber.update({
      where: { id },
      data: { active },
    });

    return NextResponse.json({ subscriber });
  } catch (error: unknown) {
    console.error('Newsletter PATCH error:', error);
    const message = error instanceof Error && error.message.includes('not found')
      ? 'Subscriber not found'
      : 'Failed to update subscriber';
    const status = message === 'Subscriber not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Subscriber deleted' });
  } catch (error: unknown) {
    console.error('Newsletter DELETE error:', error);
    const message = error instanceof Error && error.message.includes('not found')
      ? 'Subscriber not found'
      : 'Failed to delete subscriber';
    const status = message === 'Subscriber not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
