import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/attendance/self — fetch student's own attendance history
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // Fetch student's active and recent bookings with their attendance records
    const bookings = await db.booking.findMany({
      where: {
        studentId: user.id,
        status: { in: ['active', 'completed'] },
      },
      include: {
        cabin: { select: { cabinNum: true, floor: true } },
        attendance: {
          orderBy: { date: 'desc' },
          take: limit,
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Flatten attendance into a sorted list
    const records = bookings
      .flatMap((b) =>
        b.attendance.map((a) => ({
          id: a.id,
          date: a.date,
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          durationMinutes:
            a.checkIn && a.checkOut
              ? Math.round((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000)
              : null,
          cabin: {
            cabinNum: b.cabin.cabinNum,
            floor: b.cabin.floor,
          },
          bookingType: b.type,
        }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    const totalMinutes = records
      .filter((r) => r.durationMinutes !== null)
      .reduce((sum, r) => sum + (r.durationMinutes || 0), 0);

    return NextResponse.json({
      records,
      totalSessions: records.length,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    });
  } catch (error) {
    console.error('[Attendance/Self GET]', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST /api/attendance/self — student self check-in or check-out via desk QR scan
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { action, bookingId, deskQrPayload } = body || {};

    if (!action || !['checkin', 'checkout'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "checkin" or "checkout".' }, { status: 400 });
    }

    let resolvedBookingId = bookingId;

    // If a desk QR payload is provided, verify it and resolve the booking
    if (deskQrPayload) {
      let qrData: any;
      try {
        qrData = JSON.parse(deskQrPayload);
      } catch {
        return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
      }

      if (qrData.type !== 'lamka_cabin_desk') {
        return NextResponse.json({ error: 'This QR code is not a valid Lamka Coaching desk code' }, { status: 400 });
      }

      // Find the student's active booking for that cabin
      const booking = await db.booking.findFirst({
        where: {
          studentId: user.id,
          cabinId: qrData.cabinId,
          status: 'active',
        },
      });

      if (!booking) {
        return NextResponse.json({
          error: 'You do not have an active booking for this cabin',
        }, { status: 400 });
      }

      resolvedBookingId = booking.id;
    }

    if (!resolvedBookingId) {
      return NextResponse.json({ error: 'Booking ID or desk QR code is required' }, { status: 400 });
    }

    // Verify the booking belongs to this student
    const booking = await db.booking.findFirst({
      where: { id: resolvedBookingId, studentId: user.id },
      include: { cabin: { select: { cabinNum: true, floor: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (action === 'checkin') {
      const existing = await db.attendance.findFirst({
        where: {
          bookingId: resolvedBookingId,
          date: { gte: today, lt: tomorrow },
          checkIn: { not: null },
        },
      });

      if (existing) {
        return NextResponse.json({
          error: 'You have already checked in today',
          attendance: existing,
        }, { status: 400 });
      }

      const attendance = await db.attendance.create({
        data: {
          bookingId: resolvedBookingId,
          date: today,
          checkIn: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Welcome, ${user.name}! Checked in to Cabin #${booking.cabin.cabinNum}`,
        attendance,
      });
    }

    // checkout
    const existing = await db.attendance.findFirst({
      where: {
        bookingId: resolvedBookingId,
        date: { gte: today, lt: tomorrow },
        checkOut: null,
        checkIn: { not: null },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No active check-in found for today' }, { status: 400 });
    }

    const attendance = await db.attendance.update({
      where: { id: existing.id },
      data: { checkOut: new Date() },
    });

    const durationMin = Math.round(
      (new Date(attendance.checkOut!).getTime() - new Date(attendance.checkIn!).getTime()) / 60000
    );

    return NextResponse.json({
      success: true,
      message: `Checked out! You studied for ${durationMin} minutes today.`,
      attendance,
      durationMinutes: durationMin,
    });
  } catch (error) {
    console.error('[Attendance/Self POST]', error);
    return NextResponse.json({ error: 'Failed to process attendance' }, { status: 500 });
  }
}
