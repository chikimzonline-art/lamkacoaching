import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = req.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    const existing = await db.courseWaitlist.findFirst({
      where: {
        studentId: user.id,
        courseId,
      },
    });

    return NextResponse.json({ waitlisted: !!existing }, { status: 200 });
  } catch (error: any) {
    console.error('Error checking waitlist status:', error);
    return NextResponse.json({ error: 'Failed to check waitlist status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const existing = await db.courseWaitlist.findFirst({
      where: {
        studentId: user.id,
        courseId,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        waitlisted: true,
        message: 'Already on waitlist',
      }, { status: 200 });
    }

    await db.courseWaitlist.create({
      data: {
        studentId: user.id,
        courseId,
      },
    });

    return NextResponse.json({
      success: true,
      waitlisted: true,
      message: 'Successfully joined waitlist',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to join waitlist' }, { status: 500 });
  }
}
