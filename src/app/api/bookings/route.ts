import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getOverlappingBookings } from '@/lib/db/queries/bookings';
import { requireStaffOrAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/bookings - List bookings with filters (staff/admin)
export async function GET(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

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

    // For date filtering of shift bookings
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.OR = [
        // Shift bookings on this date
        {
          type: { in: ['morning_shift', 'day_shift', 'night_shift'] },
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

// POST /api/bookings - Create/update/cancel/renew bookings (staff/admin)
export async function POST(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, id, studentId, cabinId, type, startDate, endDate, startTime, endTime, totalAmount, notes, payNow, payAmount, payMode, paymentDate, receiptNo } = body;

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
      let end: Date;
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setHours(23, 59, 59, 999);
      }

      // Check for any active bookings on this cabin that overlap
      const overlappingBookings = await getOverlappingBookings(cabinId, start, end);

      for (const existing of overlappingBookings) {
        if (existing.type === 'reserved') {
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
      let payment: any = null;
      if (payNow && bookingPaidAmount > 0) {
        const receivedDate = paymentDate
          ? new Date(paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00`)
          : start;

        payment = await db.payment.create({
          data: {
            bookingId: booking.id,
            studentId,
            amount: bookingPaidAmount,
            mode: payMode || 'cash',
            status: 'completed',
            receivedAt: receivedDate,
            notes: 'Payment at admission',
            receiptNo: receiptNo || null,
          },
        });
      }

      await logAudit({
        user: auth.user,
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: booking.id,
        description: `Created ${type.replace('_', ' ')} desk booking for student '${booking.student?.name || studentId}' (Cabin #${booking.cabin?.cabinNum})`,
        details: { bookingId: booking.id, studentId, cabinId, type, totalAmount: bookingTotalAmount / 100 },
        req: request,
      });

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

      await logAudit({
        user: auth.user,
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: id,
        description: `Cancelled booking #${id} for student '${booking.student?.name || booking.studentId}' (Cabin #${booking.cabin?.cabinNum})`,
        details: { bookingId: id, studentId: booking.studentId, cabinId: booking.cabinId },
        req: request,
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
              'cabin_night_shift_rate'
            ],
          },
        },
      });

      const getSetting = (key: string, def: number) => {
        const s = settings.find((s) => s.key === key);
        return s ? parseInt(s.value, 10) : def;
      };

      if (existing.type === 'reserved') {
        renewAmount = getSetting('cabin_reserved_rate', 1100) * 100;
      } else if (existing.type === 'morning_shift') {
        renewAmount = getSetting('cabin_morning_shift_rate', 500) * 100;
      } else if (existing.type === 'day_shift') {
        renewAmount = getSetting('cabin_day_shift_rate', 800) * 100;
      } else if (existing.type === 'night_shift') {
        renewAmount = getSetting('cabin_night_shift_rate', 800) * 100;
      } else {
        renewAmount = 1000 * 100; // fallback
      }

      // Calculate new end date: current endDate + 1 month, or startDate + 1 month if no endDate
      const currentEnd = existing.endDate ? new Date(existing.endDate) : new Date(existing.startDate);
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + 1);
      newEnd.setHours(23, 59, 59, 999);

      // COLLISION PROTECTION ON RENEWAL
      const overlappingBookings = await getOverlappingBookings(existing.cabinId, currentEnd, newEnd, id);

      for (const overlap of overlappingBookings) {
        if (overlap.type === 'reserved') {
          return NextResponse.json({
            error: 'Cannot renew: A reserved booking exists for this cabin next month.',
          }, { status: 409 });
        }
        if (existing.type === 'reserved') {
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

    } else if (action === 'onboard_historical') {
      const {
        studentId,
        cabinId,
        type,
        startDate,
        endDate,
        monthlyRate,
        includeRegistrationFee,
        registrationFee,
        paidMonthsCount,
        paymentMode,
        paymentDay,
        receiptPrefix,
        notes,
      } = body;

      if (!studentId || !cabinId || !type || !startDate || !endDate || !monthlyRate) {
        return NextResponse.json({ error: 'Student ID, Cabin ID, shift type, start date, end date, and monthly rate are required' }, { status: 400 });
      }

      if (!['morning_shift', 'day_shift', 'night_shift', 'reserved'].includes(type)) {
        return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
      }

      const student = await db.student.findUnique({ where: { id: studentId } });
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const cabin = await db.cabin.findUnique({ where: { id: cabinId } });
      if (!cabin) {
        return NextResponse.json({ error: 'Cabin not found' }, { status: 404 });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (start > end) {
        return NextResponse.json({ error: 'Start date must be before or equal to end date' }, { status: 400 });
      }

      // Check for any active bookings on this cabin that overlap
      const overlappingBookings = await getOverlappingBookings(cabinId, start, end);
      for (const existing of overlappingBookings) {
        if (existing.type === 'reserved') {
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

      // Calculate monthly intervals
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      const totalMonths = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);

      const ratePaise = Math.round(Number(monthlyRate) * 100);
      const regFeePaise = includeRegistrationFee ? Math.round(Number(registrationFee || 200) * 100) : 0;
      const targetDay = Math.min(Math.max(Number(paymentDay) || 1, 1), 28);

      const milestones: {
        index: number;
        label: string;
        date: Date;
        amountPaise: number;
        hasRegFee: boolean;
      }[] = [];

      for (let i = 0; i < totalMonths; i++) {
        const mDate = new Date(startYear, startMonth + i, targetDay, 12, 0, 0);
        const mLabel = mDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        const isFirst = i === 0;
        const currentMonthFee = ratePaise + (isFirst ? regFeePaise : 0);

        milestones.push({
          index: i + 1,
          label: mLabel,
          date: mDate,
          amountPaise: currentMonthFee,
          hasRegFee: isFirst && regFeePaise > 0,
        });
      }

      const bookingTotalAmount = milestones.reduce((sum, m) => sum + m.amountPaise, 0);
      const numPaid = (paidMonthsCount === -1 || paidMonthsCount === undefined || paidMonthsCount === null)
        ? totalMonths
        : Math.min(Math.max(Number(paidMonthsCount), 0), totalMonths);

      const paidMilestones = milestones.slice(0, numPaid);
      const bookingPaidAmount = paidMilestones.reduce((sum, m) => sum + m.amountPaise, 0);

      let actualStartTime = startTime;
      let actualEndTime = endTime;
      if (type === 'morning_shift') { actualStartTime = '05:00'; actualEndTime = '10:00'; }
      if (type === 'day_shift') { actualStartTime = '10:00'; actualEndTime = '17:00'; }
      if (type === 'night_shift') { actualStartTime = '17:00'; actualEndTime = '23:59'; }

      // Execute transaction to create booking and historical payments atomically
      const result = await db.$transaction(async (tx) => {
        const newBooking = await tx.booking.create({
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
            notes: notes ? `[Historical Onboarding] ${notes}` : '[Historical Onboarding] Existing student multi-month booking',
          },
          include: {
            student: { select: { id: true, name: true, phone: true } },
            cabin: { select: { id: true, cabinNum: true } },
          },
        });

        const payments: any[] = [];
        for (let i = 0; i < paidMilestones.length; i++) {
          const m = paidMilestones[i];
          const receiptNo = receiptPrefix ? `${receiptPrefix}-${m.label.replace(/[^a-zA-Z0-9]/g, '')}-${i + 1}` : null;
          const note = m.hasRegFee
            ? `Historical desk fee (${m.label}) + registration fee`
            : `Historical desk fee (${m.label})`;

          const payment = await tx.payment.create({
            data: {
              bookingId: newBooking.id,
              studentId,
              amount: m.amountPaise,
              mode: paymentMode || 'cash',
              status: 'completed',
              receivedAt: m.date,
              notes: note,
              receiptNo,
            },
          });
          payments.push(payment);
        }

        return { booking: newBooking, payments };
      });

      revalidatePath('/dashboard/history');
      revalidatePath('/dashboard/cabins');
      revalidatePath('/dashboard/students');
      revalidatePath('/admin');

      await logAudit({
        user: auth.user,
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: result.booking.id,
        description: `Onboarded historical ${type.replace('_', ' ')} desk booking (${totalMonths} months) for student '${result.booking.student?.name || studentId}' (Cabin #${result.booking.cabin?.cabinNum}) with ${result.payments.length} monthly payments recorded`,
        details: {
          bookingId: result.booking.id,
          studentId,
          cabinId,
          type,
          totalAmount: bookingTotalAmount / 100,
          paidAmount: bookingPaidAmount / 100,
          totalMonths,
          paymentsRecorded: result.payments.length,
          startDate,
          endDate,
        },
        req: request,
      });

      return NextResponse.json({
        booking: result.booking,
        paymentsCount: result.payments.length,
        totalMonths,
        totalAmount: bookingTotalAmount / 100,
        paidAmount: bookingPaidAmount / 100,
        dueAmount: (bookingTotalAmount - bookingPaidAmount) / 100,
      });

    } else if (action === 'transfer_cabin') {
      const { id, newCabinId, notes } = body;

      if (!id || !newCabinId) {
        return NextResponse.json({ error: 'Booking ID and destination Cabin ID are required' }, { status: 400 });
      }

      // Fetch existing booking
      const existing = await db.booking.findUnique({
        where: { id },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true, floor: true } },
        },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (existing.status !== 'active') {
        return NextResponse.json({ error: 'Only active bookings can be transferred to a new cabin' }, { status: 400 });
      }
      if (existing.cabinId === newCabinId) {
        return NextResponse.json({ error: 'Student is already assigned to this cabin' }, { status: 400 });
      }

      const targetCabin = await db.cabin.findUnique({
        where: { id: newCabinId },
      });
      if (!targetCabin) {
        return NextResponse.json({ error: 'Destination cabin not found' }, { status: 404 });
      }
      if (targetCabin.status !== 'active') {
        return NextResponse.json({ error: 'Destination cabin is not active (under maintenance or inactive)' }, { status: 400 });
      }

      // Check collision on destination cabin across the booking period
      const start = new Date(existing.startDate);
      const end = existing.endDate ? new Date(existing.endDate) : new Date(start);
      if (!existing.endDate) {
        end.setMonth(end.getMonth() + 1);
      }

      const overlappingBookings = await getOverlappingBookings(newCabinId, start, end, id);

      for (const overlap of overlappingBookings) {
        if (overlap.type === 'reserved') {
          return NextResponse.json({
            error: `Cannot transfer: Cabin #${targetCabin.cabinNum} has an active reserved booking during this period.`,
          }, { status: 409 });
        }
        if (existing.type === 'reserved') {
          return NextResponse.json({
            error: `Cannot transfer reserved booking: Cabin #${targetCabin.cabinNum} has active shift bookings during this period.`,
          }, { status: 409 });
        }
        if (overlap.type === existing.type) {
          return NextResponse.json({
            error: `Cannot transfer: Cabin #${targetCabin.cabinNum} is already booked for ${existing.type.replace('_', ' ')} during this period.`,
          }, { status: 409 });
        }
      }

      const updatedNotes = existing.notes 
        ? `${existing.notes} | [Transferred from Cabin #${existing.cabin.cabinNum} to Cabin #${targetCabin.cabinNum} on ${new Date().toLocaleDateString('en-IN')}${notes ? `: ${notes}` : ''}]`
        : `[Transferred from Cabin #${existing.cabin.cabinNum} to Cabin #${targetCabin.cabinNum} on ${new Date().toLocaleDateString('en-IN')}${notes ? `: ${notes}` : ''}]`;

      const updatedBooking = await db.booking.update({
        where: { id },
        data: {
          cabinId: newCabinId,
          notes: updatedNotes,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          cabin: { select: { id: true, cabinNum: true, floor: true } },
          payments: { select: { id: true, amount: true, mode: true, receivedAt: true } },
        },
      });

      revalidatePath('/dashboard/history');
      revalidatePath('/dashboard/cabins');
      revalidatePath('/dashboard/students');
      revalidatePath('/admin');

      await logAudit({
        user: auth.user,
        action: 'BOOKING_UPDATED',
        entityType: 'Booking',
        entityId: id,
        description: `Transferred desk booking #${id} for student '${existing.student?.name || existing.studentId}' from Cabin #${existing.cabin?.cabinNum} to Cabin #${targetCabin.cabinNum}`,
        details: {
          bookingId: id,
          studentId: existing.studentId,
          oldCabinId: existing.cabinId,
          oldCabinNum: existing.cabin?.cabinNum,
          newCabinId,
          newCabinNum: targetCabin.cabinNum,
        },
        req: request,
      });

      return NextResponse.json({
        booking: updatedBooking,
        message: `Successfully transferred student to Cabin #${targetCabin.cabinNum}`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing booking request:', error);
    return NextResponse.json({ error: 'Failed to process booking request' }, { status: 500 });
  }
}

// PATCH /api/bookings - Approve or reject a pending booking (staff/admin)
export async function PATCH(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

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

    await logAudit({
      user: auth.user,
      action: action === 'approve' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
      entityType: 'Booking',
      entityId: id,
      description: `${action === 'approve' ? 'Approved' : 'Rejected'} booking request #${id} for student '${updatedBooking.student?.name || 'N/A'}' (Cabin #${updatedBooking.cabin?.cabinNum})`,
      details: { bookingId: id, action, newStatus, studentId: updatedBooking.studentId, cabinId: updatedBooking.cabinId },
      req: request,
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
