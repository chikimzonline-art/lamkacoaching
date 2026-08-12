import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/batches — list all active batches sorted by sortOrder then startDate
export async function GET() {
  try {
    const batches = await db.batch.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
      include: {
        course: {
          include: { department: true }
        }
      }
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
    const { courseId, batchName, startDate, endDate, timing, seats, status, description, sortOrder } = body;

    if (!courseId || !batchName || !startDate || !timing || seats === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, batchName, startDate, timing, seats' },
        { status: 400 }
      );
    }

    const batch = await db.batch.create({
      data: {
        courseId,
        batchName,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        timing,
        seats: Number(seats),
        status: status || 'enrolling',
        description: description || null,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    if (batch.active && (batch.status === 'enrolling' || batch.status === 'almost_full')) {
      const waitlisted = await db.courseWaitlist.findMany({
        where: { courseId: batch.courseId },
        include: { course: true }
      });
      
      if (waitlisted.length > 0) {
        await db.studentNotification.createMany({
          data: waitlisted.map(w => ({
            studentId: w.studentId,
            title: `New Batch Open: ${w.course.name}`,
            message: `A new batch starting on ${batch.startDate.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})} has opened for ${w.course.name}. Enroll now before seats fill up!`,
            link: `/dashboard`
          }))
        });
        
        await db.courseWaitlist.deleteMany({
          where: { courseId: batch.courseId }
        });
      }
    }

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Failed to create batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
