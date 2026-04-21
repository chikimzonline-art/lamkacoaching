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

      if (type === 'hourly') {
        if (!startTime || !endTime) {
          return NextResponse.json({ error: 'Start time and end time are required for hourly bookings' }, { status: 400 });
        }
        if (!startDate) {
          return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
        }

        const bookingDate = new Date(startDate);
        bookingDate.setHours(0, 0, 0, 0);

        // Check for overlapping hourly bookings on the same cabin and date
        const existingBookings = await db.booking.findMany({
          where: {
            cabinId,
            status: 'active',
            type: 'hourly',
            startDate: bookingDate,
          },
        });

        for (const existing of existingBookings) {
          if (existing.startTime && existing.endTime &&
              startTime < existing.endTime && endTime > existing.startTime) {
            return NextResponse.json({
              error: `Time slot conflict: Cabin already booked from ${existing.startTime} to ${existing.endTime} by ${existing.studentId}`,
              conflict: existing,
            }, { status: 409 });
          }
        }

        const bookingTotalAmount = Math.round(Number(totalAmount) * 100); // convert to paise
        const bookingPaidAmount = payNow ? Math.round(Number(payAmount) * 100) : 0;

        const booking = await db.booking.create({
          data: {
            studentId,
            cabinId,
            type: 'hourly',
            status: 'active',
            startDate: bookingDate,
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

      } else if (type === 'exclusive') {
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Start date and end date are required for exclusive bookings' }, { status: 400 });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Check for any active bookings on this cabin that overlap
        const overlappingBookings = await db.booking.findMany({
          where: {
            cabinId,
            status: 'active',
            OR: [
              // Existing booking starts before our end and ends after our start
              { startDate: { lte: end }, endDate: { gte: start } },
              { startDate: { lte: end }, endDate: null },
            ],
          },
        });

        if (overlappingBookings.length > 0) {
          return NextResponse.json({
            error: 'Cabin has conflicting active bookings in this period',
            conflicts: overlappingBookings,
          }, { status: 409 });
        }

        const bookingTotalAmount = Math.round(Number(totalAmount) * 100); // convert to paise
        const bookingPaidAmount = payNow ? Math.round(Number(payAmount) * 100) : 0;

        const booking = await db.booking.create({
          data: {
            studentId,
            cabinId,
            type: 'exclusive',
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
      if (existing.type !== 'exclusive') {
        return NextResponse.json({ error: 'Only exclusive bookings can be renewed' }, { status: 400 });
      }
      if (existing.status !== 'active') {
        return NextResponse.json({ error: 'Only active bookings can be renewed' }, { status: 400 });
      }

      // Get monthly rate from settings
      const monthlyRateSetting = await db.setting.findUnique({ where: { key: 'monthly_rate' } });
      const monthlyRate = monthlyRateSetting ? parseInt(monthlyRateSetting.value, 10) * 100 : 300000; // in paise

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
          totalAmount: existing.totalAmount + monthlyRate,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true } },
          payments: { select: { id: true, amount: true, mode: true, receivedAt: true } },
        },
      });

      return NextResponse.json({
        booking,
        renewedAmount: monthlyRate,
        newEndDate: newEnd.toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing booking request:', error);
    return NextResponse.json({ error: 'Failed to process booking request' }, { status: 500 });
  }
}
