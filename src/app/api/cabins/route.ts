import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAllCabinsForAdmin } from '@/lib/db/queries/cabins';
import { requireStaffOrAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/cabins - List all cabins (active, inactive, maintenance), grouped by floor (staff/admin)
export async function GET() {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const cabins = await getAllCabinsForAdmin();

    // Get unique floor numbers
    const floors = [...new Set(cabins.map((c) => c.floor))].sort((a, b) => a - b);

    return NextResponse.json({ cabins, floors });
  } catch (error) {
    console.error('Error fetching cabins:', error);
    return NextResponse.json({ error: 'Failed to fetch cabins' }, { status: 500 });
  }
}

// POST /api/cabins - Create/update/delete cabins (staff/admin)
export async function POST(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, cabinNum, floor, count, notes, status, id } = body;

    if (action === 'add') {
      if (auth.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can create cabins' }, { status: 403 });
      }

      if (!cabinNum) {
        return NextResponse.json({ error: 'Cabin number is required' }, { status: 400 });
      }
      const cabinFloor = floor ?? 3;
      const existing = await db.cabin.findUnique({
        where: { floor_cabinNum: { floor: cabinFloor, cabinNum: Number(cabinNum) } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Cabin #${cabinNum} already exists on Floor ${cabinFloor}` },
          { status: 400 }
        );
      }
      const cabin = await db.cabin.create({
        data: {
          floor: cabinFloor,
          cabinNum: Number(cabinNum),
          notes: notes || null,
          status: status || 'active',
        },
      });

      await logAudit({
        user: auth.user,
        action: 'CABIN_CREATED',
        entityType: 'Cabin',
        entityId: cabin.id,
        description: `Created Cabin #${cabin.cabinNum} on Floor ${cabin.floor}`,
        details: { floor: cabin.floor, cabinNum: cabin.cabinNum, status: cabin.status },
        req: request,
      });

      return NextResponse.json({ cabin });

    } else if (action === 'add-bulk') {
      if (auth.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can create cabins' }, { status: 403 });
      }

      const num = count || 1;
      const cabinFloor = floor ?? 3;

      // Find the last cabin number on this specific floor
      const lastCabinOnFloor = await db.cabin.findFirst({
        where: { floor: cabinFloor },
        orderBy: { cabinNum: 'desc' },
        select: { cabinNum: true },
      });
      let startNum = lastCabinOnFloor ? lastCabinOnFloor.cabinNum + 1 : 1;
      const dataToInsert = Array.from({ length: num }).map((_, i) => ({
        floor: cabinFloor,
        cabinNum: startNum + i,
        status: 'active',
      }));
      await db.cabin.createMany({ data: dataToInsert });
      
      const cabins = await db.cabin.findMany({
        where: { floor: cabinFloor, cabinNum: { gte: startNum, lt: startNum + num } }
      });

      await logAudit({
        user: auth.user,
        action: 'CABIN_CREATED',
        entityType: 'Cabin',
        description: `Bulk created ${num} cabins (#${startNum} to #${startNum + num - 1}) on Floor ${cabinFloor}`,
        details: { floor: cabinFloor, count: num, startNum },
        req: request,
      });

      return NextResponse.json({ cabins, count: num, floor: cabinFloor });

    } else if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Cabin ID is required' }, { status: 400 });
      }

      // Restrict changing floor or cabin number to admin
      if ((floor !== undefined || cabinNum !== undefined) && auth.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: Only administrators can change cabin floor or number' },
          { status: 403 }
        );
      }

      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (floor !== undefined) updateData.floor = Number(floor);
      if (cabinNum !== undefined) updateData.cabinNum = Number(cabinNum);

      // If changing floor or cabinNum, check for uniqueness conflict
      if (floor !== undefined || cabinNum !== undefined) {
        const currentCabin = await db.cabin.findUnique({ where: { id } });
        if (!currentCabin) {
          return NextResponse.json({ error: 'Cabin not found' }, { status: 404 });
        }
        const newFloor = floor !== undefined ? Number(floor) : currentCabin.floor;
        const newCabinNum = cabinNum !== undefined ? Number(cabinNum) : currentCabin.cabinNum;
        const conflict = await db.cabin.findUnique({
          where: { floor_cabinNum: { floor: newFloor, cabinNum: newCabinNum } },
        });
        if (conflict && conflict.id !== id) {
          return NextResponse.json(
            { error: `Cabin #${newCabinNum} already exists on Floor ${newFloor}` },
            { status: 400 }
          );
        }
      }

      const cabin = await db.cabin.update({
        where: { id },
        data: updateData,
      });

      await logAudit({
        user: auth.user,
        action: 'CABIN_UPDATED',
        entityType: 'Cabin',
        entityId: cabin.id,
        description: `Updated Cabin #${cabin.cabinNum} (Floor ${cabin.floor}, Status: ${cabin.status})`,
        details: updateData,
        req: request,
      });

      return NextResponse.json({ cabin });

    } else if (action === 'delete') {
      if (auth.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can delete cabins' }, { status: 403 });
      }

      if (!id) {
        return NextResponse.json({ error: 'Cabin ID is required' }, { status: 400 });
      }
      const cabinToDelete = await db.cabin.findUnique({ where: { id } });
      if (!cabinToDelete) {
        return NextResponse.json({ error: 'Cabin not found' }, { status: 404 });
      }

      const activeBookings = await db.booking.count({
        where: { cabinId: id, status: 'active' },
      });
      if (activeBookings > 0) {
        return NextResponse.json({ error: 'Cannot delete cabin with active bookings' }, { status: 400 });
      }

      await db.cabin.delete({ where: { id } });

      await logAudit({
        user: auth.user,
        action: 'CABIN_DELETED',
        entityType: 'Cabin',
        entityId: id,
        description: `Permanently deleted Cabin #${cabinToDelete.cabinNum} on Floor ${cabinToDelete.floor}`,
        details: { cabinNum: cabinToDelete.cabinNum, floor: cabinToDelete.floor },
        req: request,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing cabin request:', error);
    return NextResponse.json({ error: 'Failed to process cabin request' }, { status: 500 });
  }
}
