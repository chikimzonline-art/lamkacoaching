import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOverlappingBookings } from '@/lib/db/queries/bookings';

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

    if (!bookingType || !['reserved', 'morning_shift', 'day_shift', 'night_shift'].includes(bookingType)) {
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
    const settings = await db.setting.findMany({
      where: { key: { in: ['cabin_reserved_rate', 'cabin_morning_shift_rate', 'cabin_day_shift_rate', 'cabin_night_shift_rate'] } }
    });
    
    const getSetting = (key: string, def: number) => {
      const s = settings.find((s) => s.key === key);
      return s ? parseInt(s.value, 10) : def;
    };

    let totalAmount: number; // in paise
    let bookingStartDate: Date;
    let bookingEndDate: Date | null = null;
    let bookingStartTime: string | null = null;
    let bookingEndTime: string | null = null;
    
    bookingStartDate = new Date(startDate);
    bookingStartDate.setHours(0, 0, 0, 0);
    bookingEndDate = new Date(bookingStartDate);
    bookingEndDate.setMonth(bookingEndDate.getMonth() + 1);
    bookingEndDate.setHours(23, 59, 59, 999);

    if (bookingType === 'reserved') {
      totalAmount = getSetting('cabin_reserved_rate', 1100) * 100;
    } else if (bookingType === 'morning_shift') {
      totalAmount = getSetting('cabin_morning_shift_rate', 500) * 100;
      bookingStartTime = '06:00';
      bookingEndTime = '12:00';
    } else if (bookingType === 'day_shift') {
      totalAmount = getSetting('cabin_day_shift_rate', 800) * 100;
      bookingStartTime = '12:00';
      bookingEndTime = '18:00';
    } else if (bookingType === 'night_shift') {
      totalAmount = getSetting('cabin_night_shift_rate', 800) * 100;
      bookingStartTime = '18:00';
      bookingEndTime = '23:59';
    } else {
      return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
    }

    // Check for conflicting bookings
    const overlappingBookings = await getOverlappingBookings(cabinId, bookingStartDate, bookingEndDate);

    for (const overlap of overlappingBookings) {
      if (overlap.type === 'reserved') {
        return NextResponse.json({
          error: 'This cabin is already reserved for the selected period. Please choose a different cabin.',
        }, { status: 409 });
      }
      if (bookingType === 'reserved') {
        return NextResponse.json({
          error: 'Cannot reserve cabin: A shift booking already exists for the selected period.',
        }, { status: 409 });
      }
      if (overlap.type === bookingType) {
        return NextResponse.json({
          error: `The ${bookingType.replace('_', ' ')} is already booked for this cabin.`,
        }, { status: 409 });
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
        type: bookingType,
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
