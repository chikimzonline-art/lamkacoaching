import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Helper to verify auth


// GET /api/bookings - List bookings with filters
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const cabinId = searchParams.get('cabinId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (cabinId) where.cabinId = cabinId;
    if (studentId) where.studentId = studentId;

    // For date filtering of hourly bookings
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.OR = [
        // Shift bookings on this date
        {
          type: 'shift',
          startDate: { gte: filterDate, lt: nextDay },
        },
        // Reserved bookings that span this date
        {
          type: 'reserved',
          startDate: { lte: nextDay },
          OR: [
            { endDate: null },
            { endDate: { gte: filterDate } },
          ],
        },
      ];
    }

    const bookings = await db.booking.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        cabin: { select: { id: true, cabinNum: true, status: true } },
        payments: {
          select: { id: true, amount: true, mode: true, receivedAt: true },
        },
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/bookings - Create/update/cancel/renew bookings
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, studentId, cabinId, type, startDate, endDate, startTime, endTime, totalAmount, notes, payNow, payAmount, payMode } = body;

    if (action === 'create') {
      if (!studentId || !cabinId || !type || !totalAmount) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Validate payNow params if provided
      if (payNow && (!payAmount || Number(payAmount) <= 0 || !payMode)) {
        return NextResponse.json({ error: 'Payment amount and mode are required when recording payment' }, { status: 400 });
      }
      if (payNow && Number(payAmount) > Number(totalAmount)) {
        return NextResponse.json({ error: 'Payment amount cannot exceed total booking amount' }, { status: 400 });
      }

      if (type === 'shift') {
        if (!startTime || !endTime) {
          return NextResponse.json({ error: 'Start time and end time are required for shift bookings' }, { status: 400 });
        }
        if (!startDate) {
          return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
        }

        const bookingDate = new Date(startDate);
        bookingDate.setHours(0, 0, 0, 0);

        const bookingEndDate = body.endDate
          ? new Date(body.endDate)
          : new Date(new Date(bookingDate).setMonth(bookingDate.getMonth() + 1));
        bookingEndDate.setHours(23, 59, 59, 999);

        // Check for overlapping shift or reserved bookings
        const conflictingBooking = await db.booking.findFirst({
          where: {
            cabinId,
            status: 'active',
            OR: [
              {
                type: 'reserved',
                startDate: { lte: bookingEndDate },
                OR: [
                  { endDate: null },
                  { endDate: { gte: bookingDate } },
                ],
              },
              {
                type: 'shift',
                startTime,
                endTime,
                startDate: { lte: bookingEndDate },
                OR: [
                  { endDate: null },
                  { endDate: { gte: bookingDate } },
                ],
              },
            ],
          },
        });

        if (conflictingBooking) {
          return NextResponse.json({
            error: 'Cabin has conflicting active bookings (reserved or shift) in this period',
            conflict: conflictingBooking,
          }, { status: 409 });
        }

        const bookingTotalAmount = Math.round(Number(totalAmount) * 100); // convert to paise
        const bookingPaidAmount = payNow ? Math.round(Number(payAmount) * 100) : 0;

        const booking = await db.booking.create({
          data: {
            studentId,
            cabinId,
            type: 'shift',
            status: 'active',
            startDate: bookingDate,
            endDate: bookingEndDate,
            startTime,
            endTime,
            totalAmount: bookingTotalAmount,
            paidAmount: bookingPaidAmount,
            notes: notes || null,
          },
          include: {
            student: { select: { id: true, name: true, phone: true } },
            cabin: { select: { id: true, cabinNum: true } },
          },
        });

        // Create payment record if payNow is enabled
        let payment: any = null;
        if (payNow && bookingPaidAmount > 0) {
          payment = await db.payment.create({
            data: {
              bookingId: booking.id,
              studentId,
              amount: bookingPaidAmount,
              mode: payMode,
              status: 'completed',
              notes: 'Payment at admission',
            },
          });
        }

        return NextResponse.json({ booking, payment });

      } else if (type === 'reserved') {
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Start date and end date are required for reserved bookings' }, { status: 400 });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Check for any active bookings on this cabin that overlap in dates
        const conflictingBooking = await db.booking.findFirst({
          where: {
            cabinId,
            status: 'active',
            startDate: { lte: end },
            OR: [
              { endDate: null },
              { endDate: { gte: start } },
            ],
          },
        });

        if (conflictingBooking) {
          return NextResponse.json({
            error: 'Cabin has conflicting active bookings in this period',
            conflicts: [conflictingBooking],
          }, { status: 409 });
        }

        const bookingTotalAmount = Math.round(Number(totalAmount) * 100); // convert to paise
        const bookingPaidAmount = payNow ? Math.round(Number(payAmount) * 100) : 0;

        const booking = await db.booking.create({
          data: {
            studentId,
            cabinId,
            type: 'reserved',
            status: 'active',
            startDate: start,
            endDate: end,
            totalAmount: bookingTotalAmount,
            paidAmount: bookingPaidAmount,
            notes: notes || null,
          },
          include: {
            student: { select: { id: true, name: true, phone: true } },
            cabin: { select: { id: true, cabinNum: true } },
          },
        });

        // Create payment record if payNow is enabled
        let payment: any = null;
        if (payNow && bookingPaidAmount > 0) {
          payment = await db.payment.create({
            data: {
              bookingId: booking.id,
              studentId,
              amount: bookingPaidAmount,
              mode: payMode,
              status: 'completed',
              notes: 'Payment at admission',
            },
          });
        }

        return NextResponse.json({ booking, payment });
      }

    } else if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
      }
      const booking = await db.booking.update({
        where: { id },
        data: {
          notes: notes !== undefined ? notes : undefined,
          totalAmount: totalAmount !== undefined ? Math.round(Number(totalAmount) * 100) : undefined,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true } },
        },
      });
      return NextResponse.json({ booking });

    } else if (action === 'cancel') {
      if (!id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
      }
      const booking = await db.booking.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true } },
        },
      });
      return NextResponse.json({ booking });

    } else if (action === 'complete') {
      if (!id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
      }
      const booking = await db.booking.update({
        where: { id },
        data: { status: 'completed' },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true } },
        },
      });
      return NextResponse.json({ booking });

    } else if (action === 'renew') {
      if (!id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
      }
      // Fetch existing booking
      const existing = await db.booking.findUnique({
        where: { id },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true } },
        },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (existing.status !== 'active') {
        return NextResponse.json({ error: 'Only active bookings can be renewed' }, { status: 400 });
      }

      // Get rate from settings based on booking type
      let renewAmount: number; // in paise
      if (existing.type === 'shift') {
        let rateKey = 'shift_morning_rate';
        let defaultRate = 500;
        if (existing.startTime === '10:00') {
          rateKey = 'shift_day_rate';
          defaultRate = 800;
        } else if (existing.startTime === '17:00') {
          rateKey = 'shift_night_rate';
          defaultRate = 800;
        }
        const shiftRateSetting = await db.setting.findUnique({ where: { key: rateKey } });
        renewAmount = shiftRateSetting ? parseInt(shiftRateSetting.value, 10) * 100 : defaultRate * 100;
      } else {
        const monthlyRateSetting = await db.setting.findUnique({ where: { key: 'monthly_rate' } });
        renewAmount = monthlyRateSetting ? parseInt(monthlyRateSetting.value, 10) * 100 : 300000; // in paise
      }

      // Calculate new end date: current endDate + 1 month, or startDate + 1 month if no endDate
      const currentEnd = existing.endDate ? new Date(existing.endDate) : new Date(existing.startDate);
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + 1);
      newEnd.setHours(23, 59, 59, 999);

      // Update booking
      const booking = await db.booking.update({
        where: { id },
        data: {
          endDate: newEnd,
          totalAmount: existing.totalAmount + renewAmount,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true } },
          payments: { select: { id: true, amount: true, mode: true, receivedAt: true } },
        },
      });

      return NextResponse.json({
        booking,
        renewedAmount: renewAmount,
        newEndDate: newEnd.toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing booking request:', error);
    return NextResponse.json({ error: 'Failed to process booking request' }, { status: 500 });
  }
}

// PATCH /api/bookings - Approve or reject a pending booking
export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Booking ID and action are required' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    // Verify the booking exists and is pending
    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending bookings can be approved or rejected' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'active' : 'cancelled';

    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status: newStatus },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        cabin: { select: { id: true, cabinNum: true, status: true } },
      },
    });

    return NextResponse.json({
      booking: updatedBooking,
      message: action === 'approve' ? 'Booking approved successfully' : 'Booking rejected',
    });
  } catch (error) {
    console.error('Error processing booking action:', error);
    return NextResponse.json({ error: 'Failed to process booking action' }, { status: 500 });
  }
}
