import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/bookings - List bookings with filters
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
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
        // Hourly bookings on this date
        {
          type: 'hourly',
          startDate: { gte: filterDate, lt: nextDay },
        },
        // Exclusive bookings that span this date
        {
          type: 'exclusive',
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
    const user = await getAuthUser();
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

      if (!['morning_shift', 'day_shift', 'night_shift', 'reserved'].includes(type)) {
        return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
      }

      if (!startDate) {
        return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      let end = null;
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setHours(23, 59, 59, 999);
      }

      // Check for any active bookings on this cabin that overlap
      const overlappingBookings = await db.booking.findMany({
        where: {
          cabinId,
          status: 'active',
          OR: [
            { startDate: { lte: end }, endDate: { gte: start } },
            { startDate: { lte: end }, endDate: null },
          ],
        },
      });

      // Check specific overlaps
      for (const existing of overlappingBookings) {
        if (existing.type === 'reserved' || existing.type === 'exclusive' || existing.type === 'monthly') {
          return NextResponse.json({
            error: 'Cabin has a conflicting active reserved booking in this period',
            conflicts: overlappingBookings,
          }, { status: 409 });
        }
        if (type === 'reserved') {
          return NextResponse.json({
            error: 'Cabin cannot be reserved because it has active shift bookings in this period',
            conflicts: overlappingBookings,
          }, { status: 409 });
        }
        if (existing.type === type) {
          return NextResponse.json({
            error: `Cabin already booked for ${type.replace('_', ' ')} in this period`,
            conflicts: overlappingBookings,
          }, { status: 409 });
        }
      }

      let actualStartTime = startTime;
      let actualEndTime = endTime;
      if (type === 'morning_shift') { actualStartTime = '05:00'; actualEndTime = '10:00'; }
      if (type === 'day_shift') { actualStartTime = '10:00'; actualEndTime = '17:00'; }
      if (type === 'night_shift') { actualStartTime = '17:00'; actualEndTime = '23:59'; }

      const bookingTotalAmount = Math.round(Number(totalAmount) * 100); // convert to paise
      const bookingPaidAmount = payNow ? Math.round(Number(payAmount) * 100) : 0;

      const booking = await db.booking.create({
        data: {
          studentId,
          cabinId,
          type,
          status: 'active',
          startDate: start,
          endDate: end,
          startTime: actualStartTime,
          endTime: actualEndTime,
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
      let payment = null;
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
      
      const settings = await db.setting.findMany({
        where: {
          key: {
            in: [
              'cabin_reserved_rate',
              'cabin_morning_shift_rate',
              'cabin_day_shift_rate',
              'cabin_night_shift_rate',
              'monthly_rate',
              'hourly_rate'
            ],
          },
        },
      });

      const getSetting = (key: string, def: number) => {
        const s = settings.find((s) => s.key === key);
        return s ? parseInt(s.value, 10) : def;
      };

      if (existing.type === 'reserved' || existing.type === 'exclusive' || existing.type === 'monthly') {
        renewAmount = getSetting('cabin_reserved_rate', 1100) * 100;
      } else if (existing.type === 'morning_shift') {
        renewAmount = getSetting('cabin_morning_shift_rate', 500) * 100;
      } else if (existing.type === 'day_shift') {
        renewAmount = getSetting('cabin_day_shift_rate', 800) * 100;
      } else if (existing.type === 'night_shift') {
        renewAmount = getSetting('cabin_night_shift_rate', 800) * 100;
      } else if (existing.type === 'hourly') {
        renewAmount = getSetting('hourly_rate', 1000) * 100;
      } else {
        renewAmount = 1000 * 100; // fallback
      }

      // Calculate new end date: current endDate + 1 month, or startDate + 1 month if no endDate
      const currentEnd = existing.endDate ? new Date(existing.endDate) : new Date(existing.startDate);
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + 1);
      newEnd.setHours(23, 59, 59, 999);

      // COLLISION PROTECTION ON RENEWAL
      const overlappingBookings = await db.booking.findMany({
        where: {
          cabinId: existing.cabinId,
          status: 'active',
          id: { not: id }, // ignore current booking
          OR: [
            { startDate: { lte: newEnd }, endDate: { gte: currentEnd } },
            { startDate: { lte: newEnd }, endDate: null },
          ],
        },
      });

      for (const overlap of overlappingBookings) {
        if (overlap.type === 'reserved' || overlap.type === 'exclusive' || overlap.type === 'monthly') {
          return NextResponse.json({
            error: 'Cannot renew: A reserved booking exists for this cabin next month.',
          }, { status: 409 });
        }
        if (existing.type === 'reserved' || existing.type === 'exclusive' || existing.type === 'monthly') {
          return NextResponse.json({
            error: 'Cannot renew reserved cabin: Another shift booking exists next month.',
          }, { status: 409 });
        }
        if (overlap.type === existing.type) {
          return NextResponse.json({
            error: `Cannot renew: The ${existing.type.replace('_', ' ')} is already booked by someone else next month.`,
          }, { status: 409 });
        }
      }

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
    const user = await getAuthUser();
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
