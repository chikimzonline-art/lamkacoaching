import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { Client } from '@upstash/workflow';
import { env } from '@/env';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import {
  isBookingCurrentlyBlocking,
  isRegistrationFeeWaived,
  calculateCabinPricing,
  getCalendarMonthEndDate,
} from '@/lib/helpers/cabin-dates';

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

// GET /api/student/cabins - Get complete student cabin dashboard & availability
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await db.student.findUnique({
      where: { id: user.id },
      include: {
        bookings: {
          where: { status: { in: ['active', 'pending_payment'] } },
          include: { cabin: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const [cabins, settings, studentPastBookings] = await Promise.all([
      db.cabin.findMany({
        where: { status: 'active' },
        orderBy: [{ floor: 'asc' }, { cabinNum: 'asc' }],
        include: {
          bookings: {
            where: { status: { in: ['active', 'pending_payment'] } },
            select: {
              id: true,
              type: true,
              startDate: true,
              endDate: true,
              startTime: true,
              endTime: true,
              studentId: true,
              status: true,
            },
          },
        },
      }),
      db.setting.findMany({
        where: {
          key: {
            in: [
              'cabin_registration_fee',
              'cabin_reserved_rate',
              'cabin_morning_shift_rate',
              'cabin_day_shift_rate',
              'cabin_night_shift_rate',
            ],
          },
        },
      }),
      db.booking.findMany({
        where: {
          studentId: student.id,
          cabinId: { not: '' },
        },
        select: {
          createdAt: true,
          endDate: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const getSetting = (key: string, def: number) => {
      const s = settings.find((item) => item.key === key);
      return s ? parseInt(s.value, 10) : def;
    };

    const pricing = {
      registrationFee: getSetting('cabin_registration_fee', 500),
      reservedRate: getSetting('cabin_reserved_rate', 1100),
      morningShiftRate: getSetting('cabin_morning_shift_rate', 500),
      dayShiftRate: getSetting('cabin_day_shift_rate', 800),
      nightShiftRate: getSetting('cabin_night_shift_rate', 800),
    };

    const bookedCabinIds = student.bookings
      .filter((b) => b.status !== 'completed' && b.status !== 'cancelled')
      .map((b) => b.cabinId);

    const now = new Date();
    const isRegistrationWaived = isRegistrationFeeWaived(studentPastBookings, now);
    const monthEndDate = getCalendarMonthEndDate(now);
    const isSecondHalf = now.getDate() > 15;

    const cabinsWithAvailability = cabins.map((cabin) => {
      const isBookedByMe = bookedCabinIds.includes(cabin.id);

      if (isBookedByMe) {
        return {
          id: cabin.id,
          floor: cabin.floor,
          cabinNum: cabin.cabinNum,
          notes: cabin.notes,
          isOccupied: true,
          isBookedByMe: true,
          bookedShifts: [],
          activeShiftsToday: [],
          activeBookingsCount: cabin.bookings.length,
        };
      }

      const activeReserved = cabin.bookings.find((b) => {
        if (b.type !== 'reserved') return false;
        return isBookingCurrentlyBlocking(b);
      });

      const activeShifts = cabin.bookings.filter((b) => {
        if (!['morning_shift', 'day_shift', 'night_shift'].includes(b.type)) return false;
        return isBookingCurrentlyBlocking(b);
      });

      const isOccupied = !!activeReserved || activeShifts.length >= 3;

      return {
        id: cabin.id,
        floor: cabin.floor,
        cabinNum: cabin.cabinNum,
        notes: cabin.notes,
        isOccupied,
        isBookedByMe: false,
        bookedShifts: activeShifts.map((b) => b.type),
        activeShiftsToday: activeShifts.map((b) => ({
          startTime: b.startTime || '',
          endTime: b.endTime || '',
          type: b.type,
        })),
        activeBookingsCount: cabin.bookings.length,
      };
    });

    const floors = [...new Set(cabins.map((c) => c.floor))].sort((a, b) => a - b);
    const cabinsByFloor = floors.map((floorNum) => ({
      floor: floorNum,
      label: formatFloorLabel(floorNum),
      cabins: cabinsWithAvailability.filter((c) => c.floor === floorNum),
    }));

    const isFirstBooking = !isRegistrationWaived;

    const rawPendingCheckout = student.bookings.find(
      (b) => b.status === 'pending_payment' && b.paidAmount === 0 && b.cabinId !== ''
    );
    let pendingCheckout: any = null;

    if (rawPendingCheckout) {
      const pCabin = cabins.find((c) => c.id === rawPendingCheckout.cabinId);
      if (pCabin) {
        pendingCheckout = {
          id: rawPendingCheckout.id,
          type: rawPendingCheckout.type,
          startDate: rawPendingCheckout.startDate,
          endDate: rawPendingCheckout.endDate,
          totalAmount: rawPendingCheckout.totalAmount,
          cabinInfo: {
            id: pCabin.id,
            floor: pCabin.floor,
            cabinNum: pCabin.cabinNum,
          },
        };
      }
    }

    const myBookings = student.bookings.map((b) => ({
      id: b.id,
      cabinId: b.cabinId,
      cabinNum: b.cabin?.cabinNum ?? 0,
      floor: b.cabin?.floor ?? 0,
      type: b.type,
      status: b.status,
      startDate: b.startDate,
      endDate: b.endDate,
      startTime: b.startTime,
      endTime: b.endTime,
      totalAmount: b.totalAmount,
      paidAmount: b.paidAmount,
    }));

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        email: student.email,
      },
      cabins: cabinsWithAvailability,
      cabinsByFloor,
      floors,
      pricing,
      isFirstBooking,
      isRegistrationWaived,
      isSecondHalf,
      monthEndDate,
      pendingCheckout,
      myBookings,
      totalCabins: cabins.length,
      availableCabins: cabinsWithAvailability.filter((c) => !c.isOccupied).length,
    });
  } catch (error) {
    console.error('Error fetching student cabins:', error);
    return NextResponse.json({ error: 'Failed to fetch cabins' }, { status: 500 });
  }
}

const BookCabinSchema = z.object({
  cabinId: z.string().min(1, 'Cabin ID is required'),
  bookingType: z.enum(['reserved', 'morning_shift', 'day_shift', 'night_shift']),
  startDate: z.string().min(1, 'Start date is required'),
});

// POST /api/student/cabins - Create pending reservation with 10-minute hold
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cabinId, bookingType, startDate: startDateStr } = BookCabinSchema.parse(body);

    const student = await db.student.findUnique({
      where: { id: user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const existingPendingBooking = await db.booking.findFirst({
      where: {
        studentId: student.id,
        status: 'pending_payment',
        cabinId: { not: '' },
      },
    });

    if (existingPendingBooking) {
      return NextResponse.json(
        { error: 'You already have a pending cabin booking. Please cancel it or complete the payment first.' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return NextResponse.json({ error: 'Start date cannot be in the past.' }, { status: 400 });
    }

    const newBooking = await db.$transaction(async (tx) => {
      const cabin = await tx.cabin.findUnique({
        where: { id: cabinId },
        include: {
          bookings: {
            where: { status: 'active' },
          },
        },
      });

      if (!cabin) {
        throw new Error('Cabin not found.');
      }

      const isOccupied = cabin.bookings.some((b) => {
        if (!isBookingCurrentlyBlocking(b)) return false;
        if (b.type === 'reserved') return true;
        if (bookingType === 'reserved') return true;
        if (b.type === bookingType) return true;
        return false;
      });

      if (isOccupied) {
        throw new Error('This cabin is not available on the selected date for this shift.');
      }

      const settings = await tx.setting.findMany({
        where: {
          key: {
            in: [
              'cabin_registration_fee',
              'cabin_reserved_rate',
              'cabin_morning_shift_rate',
              'cabin_day_shift_rate',
              'cabin_night_shift_rate',
            ],
          },
        },
      });

      const getSetting = (key: string, def: number) => {
        const s = settings.find((item) => item.key === key);
        return s ? parseInt(s.value, 10) : def;
      };

      const registrationFee = getSetting('cabin_registration_fee', 500);
      const reservedRate = getSetting('cabin_reserved_rate', 1100);
      const morningShiftRate = getSetting('cabin_morning_shift_rate', 500);
      const dayShiftRate = getSetting('cabin_day_shift_rate', 800);
      const nightShiftRate = getSetting('cabin_night_shift_rate', 800);

      let feePerMonth = 0;
      let startTime = '';
      let endTime = '';

      if (bookingType === 'reserved') {
        feePerMonth = reservedRate;
      } else if (bookingType === 'morning_shift') {
        feePerMonth = morningShiftRate;
        startTime = '05:00';
        endTime = '10:00';
      } else if (bookingType === 'day_shift') {
        feePerMonth = dayShiftRate;
        startTime = '10:00';
        endTime = '17:00';
      } else if (bookingType === 'night_shift') {
        feePerMonth = nightShiftRate;
        startTime = '17:00';
        endTime = '23:59';
      }

      const priorBookings = await tx.booking.findMany({
        where: {
          studentId: student.id,
          cabinId: { not: '' },
        },
        select: {
          createdAt: true,
          endDate: true,
          status: true,
        },
      });

      const isRegWaived = isRegistrationFeeWaived(priorBookings, startDate);
      const pricingCalculation = calculateCabinPricing({
        startDate,
        baseRate: feePerMonth,
        registrationFee,
        isRegistrationWaived: isRegWaived,
      });

      const endDate = pricingCalculation.endDate;
      const totalAmountPaise = pricingCalculation.totalAmountInPaise;

      return await tx.booking.create({
        data: {
          studentId: student.id,
          cabinId: cabin.id,
          type: bookingType,
          startDate,
          endDate,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          totalAmount: totalAmountPaise,
          paidAmount: 0,
          status: 'pending_payment',
          notes: `Booked via Native Mobile Client${pricingCalculation.isSecondHalf ? ' (50% Mid-Month Rate)' : ''}${isRegWaived ? ' (Registration Fee Waived - 3mo Validity)' : ''}`,
        },
      });
    });

    // Invalidate cache immediately so availability updates everywhere
    revalidatePath('/dashboard/cabins');
    revalidatePath('/cabins');

    // Trigger Upstash 10-minute hold cleanup workflow if token is configured
    try {
      if (env.QSTASH_TOKEN) {
        const workflowClient = new Client({ token: env.QSTASH_TOKEN });
        const baseUrl = env.NEXTAUTH_URL || 'http://localhost:3000';
        await workflowClient.trigger({
          url: `${baseUrl}/api/workflow/cleanup-booking`,
          body: { bookingId: newBooking.id },
        });
      }
    } catch (workflowErr) {
      console.warn('Could not trigger cleanup workflow:', workflowErr);
    }

    return NextResponse.json({
      success: true,
      bookingId: newBooking.id,
      totalAmount: newBooking.totalAmount,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    console.error('Mobile Booking Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during booking.' },
      { status: 400 }
    );
  }
}

// DELETE /api/student/cabins - Cancel pending booking
export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.studentId !== user.id) {
      return NextResponse.json({ error: 'Booking not found or unauthorized.' }, { status: 404 });
    }

    if (booking.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Only pending bookings can be cancelled.' }, { status: 400 });
    }

    await db.booking.delete({
      where: { id: bookingId },
    });

    revalidatePath('/dashboard/cabins');
    revalidatePath('/cabins');

    return NextResponse.json({ success: true, message: 'Reservation cancelled successfully.' });
  } catch (error: any) {
    Sentry.captureException(error);
    console.error('Cancel Booking Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during cancellation.' },
      { status: 500 }
    );
  }
}
