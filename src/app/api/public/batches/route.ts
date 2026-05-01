import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/batches — returns all active batches with status not "closed"
export async function GET() {
  try {
    const batches = await db.batch.findMany({
      where: {
        active: true,
        status: { not: 'closed' },
      },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
    });
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Failed to fetch public batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}
