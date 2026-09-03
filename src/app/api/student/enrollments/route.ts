import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: user.id,
        status: 'active',
      },
      include: {
        course: {
          include: { department: true },
        },
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, batchId } = await req.json();
    if (!courseId || !batchId) {
      return NextResponse.json({ error: 'Course ID and Batch ID are required' }, { status: 400 });
    }

    // Check if student is already actively enrolled
    const activeEnrollment = await db.enrollment.findFirst({
      where: {
        studentId: user.id,
        courseId: courseId,
        status: 'active',
      },
    });

    if (activeEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    // Check if there is an existing pending enrollment to reuse
    let enrollment = await db.enrollment.findFirst({
      where: {
        studentId: user.id,
        courseId: courseId,
        status: 'pending_payment',
      },
    });

    if (!enrollment) {
      const course = await db.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      enrollment = await db.enrollment.create({
        data: {
          studentId: user.id,
          courseId: course.id,
          batchId: batchId,
          startDate: new Date(),
          totalFee: course.totalFee,
          paidAmount: 0,
          status: 'pending_payment',
          notes: 'Registered via Mobile App',
        },
      });
    } else if (enrollment.batchId !== batchId) {
      // Update the batch if student changed their mind before paying
      enrollment = await db.enrollment.update({
        where: { id: enrollment.id },
        data: { batchId },
      });
    }

    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      totalFee: enrollment.totalFee,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating enrollment draft:', error);
    return NextResponse.json({ error: error.message || 'Failed to create enrollment draft' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId } = await req.json();
    if (!enrollmentId) {
      return NextResponse.json({ error: 'Missing enrollment ID' }, { status: 400 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (enrollment && enrollment.studentId === user.id && enrollment.status === 'pending_payment' && enrollment.paidAmount === 0) {
      await db.enrollment.delete({
        where: { id: enrollmentId },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Error cancelling draft enrollment:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel enrollment' }, { status: 500 });
  }
}
