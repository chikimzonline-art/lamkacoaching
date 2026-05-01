import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/batches — list all active batches sorted by sortOrder then startDate
export async function GET() {
  try {
    const batches = await db.batch.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
    });
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

// POST /api/batches — create a new batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseName, department, startDate, duration, timing, seats, status, fee, description, sortOrder } = body;

    if (!courseName || !department || !startDate || !duration || !timing || seats === undefined || fee === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: courseName, department, startDate, duration, timing, seats, fee' },
        { status: 400 }
      );
    }

    const batch = await db.batch.create({
      data: {
        courseName,
        department,
        startDate: new Date(startDate),
        duration,
        timing,
        seats: Number(seats),
        status: status || 'enrolling',
        fee: Number(fee),
        description: description || null,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Failed to create batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
