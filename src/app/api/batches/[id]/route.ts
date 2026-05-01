import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/batches/[id] — update a batch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.batch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.courseName !== undefined) updateData.courseName = body.courseName;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.timing !== undefined) updateData.timing = body.timing;
    if (body.seats !== undefined) updateData.seats = Number(body.seats);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.fee !== undefined) updateData.fee = Number(body.fee);
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);
    if (body.active !== undefined) updateData.active = Boolean(body.active);

    const batch = await db.batch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Failed to update batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}

// DELETE /api/batches/[id] — delete a batch
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.batch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    await db.batch.delete({ where: { id } });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Failed to delete batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    );
  }
}
