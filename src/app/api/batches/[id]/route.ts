import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaffOrAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// PUT /api/batches/[id] — update a batch (staff/admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

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

    await logAudit({
      user: auth.user,
      action: 'BATCH_UPDATED',
      entityType: 'Batch',
      entityId: id,
      description: `Updated batch '${batch.batchName}' (Status: ${batch.status}, Seats: ${batch.seats})`,
      details: { batchId: id, updatedFields: Object.keys(updateData) },
      req: request,
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

// DELETE /api/batches/[id] — delete a batch (staff/admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

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

    await logAudit({
      user: auth.user,
      action: 'BATCH_DELETED',
      entityType: 'Batch',
      entityId: id,
      description: `Deleted batch '${existing.batchName}'`,
      details: { batchId: id, batchName: existing.batchName, courseId: existing.courseId },
      req: request,
    });

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
