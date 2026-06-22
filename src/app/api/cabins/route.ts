import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { revalidateHome, revalidateCabins } from '@/lib/revalidate';

// Helper to verify auth


// GET /api/cabins - List all cabins, grouped by floor
export async function GET() {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cabins = await db.cabin.findMany({
      orderBy: [{ floor: 'asc' }, { cabinNum: 'asc' }],
      include: {
        bookings: {
          where: { status: 'active' },
          include: {
            student: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    // Get unique floor numbers
    const floors = [...new Set(cabins.map((c) => c.floor))].sort((a, b) => a - b);

    return NextResponse.json({ cabins, floors });
  } catch (error) {
    console.error('Error fetching cabins:', error);
    return NextResponse.json({ error: 'Failed to fetch cabins' }, { status: 500 });
  }
}

// POST /api/cabins - Create/update/delete cabins
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, cabinNum, floor, count, notes, status, id } = body;

    if (action === 'add') {
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
      revalidateHome();
      revalidateCabins();
      return NextResponse.json({ cabin });

    } else if (action === 'add-bulk') {
      const num = count || 1;
      const cabinFloor = floor ?? 3;

      // Find the last cabin number on this specific floor
      const lastCabinOnFloor = await db.cabin.findFirst({
        where: { floor: cabinFloor },
        orderBy: { cabinNum: 'desc' },
        select: { cabinNum: true },
      });
      let startNum = lastCabinOnFloor ? lastCabinOnFloor.cabinNum + 1 : 1;
      const cabins: any[] = [];
      for (let i = 0; i < num; i++) {
        const cabin = await db.cabin.create({
          data: { floor: cabinFloor, cabinNum: startNum + i, status: 'active' },
        });
        cabins.push(cabin);
      }
      revalidateHome();
      revalidateCabins();
      return NextResponse.json({ cabins, count: num, floor: cabinFloor });

    } else if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Cabin ID is required' }, { status: 400 });
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
      revalidateHome();
      revalidateCabins();
      return NextResponse.json({ cabin });

    } else if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Cabin ID is required' }, { status: 400 });
      }
      const activeBookings = await db.booking.count({
        where: { cabinId: id, status: 'active' },
      });
      if (activeBookings > 0) {
        return NextResponse.json({ error: 'Cannot delete cabin with active bookings' }, { status: 400 });
      }
      await db.cabin.delete({ where: { id } });
      revalidateHome();
      revalidateCabins();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing cabin request:', error);
    return NextResponse.json({ error: 'Failed to process cabin request' }, { status: 500 });
  }
}
