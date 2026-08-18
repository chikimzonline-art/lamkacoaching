import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { createRazorpayOrder } from '@/lib/razorpay-server';
import { getOverlappingBookings } from '@/lib/db/queries/bookings';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Fetch existing booking
    const existing = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    if (existing.studentId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to renew this booking' }, { status: 403 });
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
      return NextResponse.json({ error: 'Invalid booking type for renewal' }, { status: 400 });
    }

    // Calculate new end date (for collision check)
    const currentEnd = existing.endDate ? new Date(existing.endDate) : new Date(existing.startDate);
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + 1);
    newEnd.setHours(23, 59, 59, 999);

    // COLLISION PROTECTION ON RENEWAL
    const overlappingBookings = await getOverlappingBookings(existing.cabinId, currentEnd, newEnd, bookingId);

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

    // No collisions! Create Razorpay order
    const receipt = `rcpt_rnw_${Date.now()}`;
    const notes = {
      type: 'cabin_renewal',
      bookingId: existing.id,
      studentId: existing.studentId,
    };

    const order = await createRazorpayOrder(renewAmount, receipt, notes);

    return NextResponse.json({ 
      orderId: order.id, 
      amount: renewAmount,
      newEndDate: newEnd.toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating renewal order:', error);
    return NextResponse.json({ error: 'Failed to create renewal order' }, { status: 500 });
  }
}
