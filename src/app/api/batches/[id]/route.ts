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
    if (body.courseId !== undefined) updateData.courseId = body.courseId;
    if (body.batchName !== undefined) updateData.batchName = body.batchName;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.timing !== undefined) updateData.timing = body.timing;
    if (body.seats !== undefined) updateData.seats = Number(body.seats);
    if (body.status !== undefined) updateData.status = body.status;
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

    const enrollmentCount = await db.enrollment.count({ where: { batchId: id } });
    if (enrollmentCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete batch: ${enrollmentCount} student enrollment${enrollmentCount > 1 ? 's are' : ' is'} associated with this batch. Please delete or reassign them first.`,
        },
        { status: 400 }
      );
    }

    await db.batch.delete({ where: { id } });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Failed to delete batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete batch';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
