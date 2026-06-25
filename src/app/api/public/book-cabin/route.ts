import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { revalidateCabins } from '@/lib/revalidate';

// POST /api/public/book-cabin - Public: student self-books a cabin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address, cabinId, bookingType, startDate } = body;

    // Validate required fields
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    if (!cabinId) {
      return NextResponse.json(
        { error: 'Please select a cabin' },
        { status: 400 }
      );
    }

    if (!bookingType || !['shift', 'reserved'].includes(bookingType)) {
      return NextResponse.json(
        { error: 'Please select a valid booking type' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneStr = phone.trim();
    if (!/^[6-9]\d{9}$/.test(phoneStr)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400 }
      );
    }

    // Validate cabin exists and is active
    const cabin = await db.cabin.findUnique({
      where: { id: cabinId, status: 'active' },
    });
    if (!cabin) {
      return NextResponse.json(
        { error: 'Selected cabin is not available' },
        { status: 404 }
      );
    }

    // Get pricing settings
    const morningRateSetting = await db.setting.findUnique({ where: { key: 'shift_morning_rate' } });
    const dayRateSetting = await db.setting.findUnique({ where: { key: 'shift_day_rate' } });
    const nightRateSetting = await db.setting.findUnique({ where: { key: 'shift_night_rate' } });
    const monthlyRateSetting = await db.setting.findUnique({ where: { key: 'monthly_rate' } });
    const regFeeSetting = await db.setting.findUnique({ where: { key: 'booking_registration_fee' } });

    const morningRate = morningRateSetting ? parseInt(morningRateSetting.value, 10) : 500;
    const dayRate = dayRateSetting ? parseInt(dayRateSetting.value, 10) : 800;
    const nightRate = nightRateSetting ? parseInt(nightRateSetting.value, 10) : 800;
    const monthlyRate = monthlyRateSetting ? parseInt(monthlyRateSetting.value, 10) : 3000;
    const regFee = regFeeSetting ? parseInt(regFeeSetting.value, 10) : 500;

    let totalAmount: number; // in paise
    let bookingStartDate: Date;
    let bookingEndDate: Date | null = null;
    let bookingStartTime: string | null = null;
    let bookingEndTime: string | null = null;
    let dbBookingType: string;

    if (bookingType === 'shift') {
      const { startTime, endTime } = body;
      if (!startTime || !endTime) {
        return NextResponse.json(
          { error: 'Please select a shift' },
          { status: 400 }
        );
      }

      bookingStartDate = new Date(startDate);
      bookingStartDate.setHours(0, 0, 0, 0);
      bookingEndDate = new Date(bookingStartDate);
      bookingEndDate.setMonth(bookingEndDate.getMonth() + 1);
      bookingEndDate.setHours(23, 59, 59, 999);
      dbBookingType = 'shift';
      bookingStartTime = startTime;
      bookingEndTime = endTime;

      let baseRate = dayRate;
      if (startTime === '05:00') {
        baseRate = morningRate;
      } else if (startTime === '10:00') {
        baseRate = dayRate;
      } else if (startTime === '17:00') {
        baseRate = nightRate;
      }

      totalAmount = (baseRate + regFee) * 100; // Total in paise (shift rate + registration fee)

      // Check for conflicting bookings (same cabin, overlapping period, overlapping shift time or reserved booking)
      const overlappingBookings = await db.booking.findMany({
        where: {
          cabinId,
          status: 'active',
          OR: [
            {
              type: 'reserved',
              startDate: { lte: bookingEndDate },
              OR: [
                { endDate: null },
                { endDate: { gte: bookingStartDate } }
              ]
            },
            {
              type: 'shift',
              startTime: bookingStartTime,
              endTime: bookingEndTime,
              startDate: { lte: bookingEndDate },
              OR: [
                { endDate: null },
                { endDate: { gte: bookingStartDate } }
              ]
            }
          ]
        },
      });

      if (overlappingBookings.length > 0) {
        return NextResponse.json(
          { error: 'This cabin already has a conflict for the selected period/shift. Please choose a different cabin, shift, or date.' },
          { status: 409 }
        );
      }

    } else {
      // Monthly booking (reserved/full-day)
      bookingStartDate = new Date(startDate);
      bookingStartDate.setHours(0, 0, 0, 0);
      bookingEndDate = new Date(bookingStartDate);
      bookingEndDate.setMonth(bookingEndDate.getMonth() + 1);
      bookingEndDate.setHours(23, 59, 59, 999);
      dbBookingType = 'reserved';
      totalAmount = (monthlyRate + regFee) * 100; // Total in paise (monthly rate + registration fee)

      // Check for conflicting bookings (any active booking during this period)
      const overlappingBookings = await db.booking.findMany({
        where: {
          cabinId,
          status: 'active',
          startDate: { lte: bookingEndDate },
          OR: [
            { endDate: null },
            { endDate: { gte: bookingStartDate } }
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        return NextResponse.json(
          { error: 'This cabin is already booked/reserved for the selected period. Please choose a different cabin or date.' },
          { status: 409 }
        );
      }
    }

    // Find or create student
    let student = await db.student.findUnique({
      where: { phone: phoneStr },
    });

    if (!student) {
      student = await db.student.create({
        data: {
          name: name.trim(),
          phone: phoneStr,
          email: email?.trim() || null,
          address: address?.trim() || null,
          notes: 'Registered via website (cabin booking)',
          source: 'website',
        },
      });
    }

    // Create booking with pending status (needs admin confirmation)
    const booking = await db.booking.create({
      data: {
        studentId: student.id,
        cabinId,
        type: dbBookingType,
        status: 'pending',
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        totalAmount,
        paidAmount: 0,
        notes: 'Self-booked via website - awaiting confirmation',
      },
      include: {
        cabin: { select: { cabinNum: true } },
      },
    });

    revalidateCabins();
    return NextResponse.json({
      success: true,
      message: 'Cabin booking request submitted successfully! We will contact you to confirm your booking.',
      booking: {
        id: booking.id,
        cabinNum: booking.cabin.cabinNum,
        type: bookingType,
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Error booking cabin:', error);
    return NextResponse.json(
      { error: 'Booking failed. Please try again later.' },
      { status: 500 }
    );
  }
}
