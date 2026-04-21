import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper to verify auth
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/cabins - List all cabins
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cabins = await db.cabin.findMany({
      orderBy: { cabinNum: 'asc' },
      include: {
        bookings: {
          where: { status: 'active' },
          include: {
            student: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ cabins });
  } catch (error) {
    console.error('Error fetching cabins:', error);
    return NextResponse.json({ error: 'Failed to fetch cabins' }, { status: 500 });
  }
}

// POST /api/cabins - Create/update/delete cabins
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, cabinNum, count, notes, status, id } = body;

    if (action === 'add') {
      if (!cabinNum) {
        return NextResponse.json({ error: 'Cabin number is required' }, { status: 400 });
      }
      const existing = await db.cabin.findUnique({ where: { cabinNum: Number(cabinNum) } });
      if (existing) {
        return NextResponse.json({ error: 'Cabin number already exists' }, { status: 400 });
      }
      const cabin = await db.cabin.create({
        data: { cabinNum: Number(cabinNum), notes: notes || null, status: status || 'active' },
      });
      return NextResponse.json({ cabin });

    } else if (action === 'add-bulk') {
      const num = count || 1;
      const lastCabin = await db.cabin.findFirst({
        orderBy: { cabinNum: 'desc' },
        select: { cabinNum: true },
      });
      let startNum = lastCabin ? lastCabin.cabinNum + 1 : 1;
      const cabins = [];
      for (let i = 0; i < num; i++) {
        const cabin = await db.cabin.create({
          data: { cabinNum: startNum + i, status: 'active' },
        });
        cabins.push(cabin);
      }
      return NextResponse.json({ cabins, count: num });

    } else if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Cabin ID is required' }, { status: 400 });
      }
      const cabin = await db.cabin.update({
        where: { id },
        data: { status: status || undefined, notes: notes !== undefined ? notes : undefined },
      });
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
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing cabin request:', error);
    return NextResponse.json({ error: 'Failed to process cabin request' }, { status: 500 });
  }
}
