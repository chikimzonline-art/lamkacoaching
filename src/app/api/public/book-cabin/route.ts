import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    if (!bookingType || !['hourly', 'monthly'].includes(bookingType)) {
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

    // Get pricing
    const hourlyRateSetting = await db.setting.findUnique({ where: { key: 'hourly_rate' } });
    const monthlyRateSetting = await db.setting.findUnique({ where: { key: 'monthly_rate' } });
    const hourlyMonthlyRate = hourlyRateSetting ? parseInt(hourlyRateSetting.value, 10) : 1000;
    const monthlyRate = monthlyRateSetting ? parseInt(monthlyRateSetting.value, 10) : 3000;

    let totalAmount: number; // in paise
    let bookingStartDate: Date;
    let bookingEndDate: Date | null = null;
    let bookingStartTime: string | null = null;
    let bookingEndTime: string | null = null;
    let dbBookingType: string;

    if (bookingType === 'hourly') {
      // Hourly booking: 5 hrs/day, 1 month duration, monthly fee
      bookingStartDate = new Date(startDate);
      bookingStartDate.setHours(0, 0, 0, 0);
      bookingEndDate = new Date(bookingStartDate);
      bookingEndDate.setMonth(bookingEndDate.getMonth() + 1);
      bookingEndDate.setHours(23, 59, 59, 999);
      dbBookingType = 'hourly';
      bookingStartTime = '09:00'; // Default 5-hour window start
      bookingEndTime = '14:00';   // Default 5-hour window end
      totalAmount = hourlyMonthlyRate * 100; // Monthly fee in paise

      // Check for conflicting hourly bookings (same cabin, overlapping period)
      const overlappingBookings = await db.booking.findMany({
        where: {
          cabinId,
          status: 'active',
          type: 'hourly',
          OR: [
            { startDate: { lte: bookingEndDate }, endDate: { gte: bookingStartDate } },
            { startDate: { lte: bookingEndDate }, endDate: null },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        return NextResponse.json(
          { error: 'This cabin already has an active hourly booking for the selected period. Please choose a different cabin or date.' },
          { status: 409 }
        );
      }

    } else {
      // Monthly booking (exclusive/full-day)
      bookingStartDate = new Date(startDate);
      bookingStartDate.setHours(0, 0, 0, 0);
      bookingEndDate = new Date(bookingStartDate);
      bookingEndDate.setMonth(bookingEndDate.getMonth() + 1);
      bookingEndDate.setHours(23, 59, 59, 999);
      dbBookingType = 'exclusive';
      totalAmount = monthlyRate * 100; // convert to paise

      // Check for conflicting bookings
      const overlappingBookings = await db.booking.findMany({
        where: {
          cabinId,
          status: 'active',
          OR: [
            { startDate: { lte: bookingEndDate }, endDate: { gte: bookingStartDate } },
            { startDate: { lte: bookingEndDate }, endDate: null },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        return NextResponse.json(
          { error: 'This cabin is already booked for the selected period. Please choose a different cabin or date.' },
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
