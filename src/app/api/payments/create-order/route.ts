import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { createRazorpayOrder } from '@/lib/razorpay-server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
       console.warn('Creating order without active session');
    }

    const { amount: _clientAmount, notes } = await req.json();

    const receipt = `rcpt_${Date.now()}`;
    const orderNotes = notes || {}; 
    const { type, itemId, studentId, bookingId } = orderNotes;

    if (!type || (!itemId && !bookingId)) {
      return NextResponse.json({ error: 'Missing type or item ID' }, { status: 400 });
    }

    let calculatedAmountPaise = 0;
    const resolvedStudentId = (session?.user as any)?.id || studentId;

    if (type === 'course') {
      const enrollment = await db.enrollment.findFirst({
        where: { studentId: resolvedStudentId, courseId: itemId, status: { in: ['pending_payment', 'active'] } }
      });
      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
      }
      
      const due = enrollment.totalFee - enrollment.paidAmount;
      if (due <= 0) return NextResponse.json({ error: 'No pending dues' }, { status: 400 });
      
      if (_clientAmount && _clientAmount > 0 && _clientAmount <= (due * 100)) {
         calculatedAmountPaise = _clientAmount;
      } else {
         calculatedAmountPaise = due * 100;
      }

    } else if (type === 'cabin') {
      const booking = await db.booking.findFirst({
        where: { 
          cabinId: itemId, 
          studentId: resolvedStudentId, 
          status: { in: ['pending_payment', 'expired', 'active'] } 
        },
        orderBy: { createdAt: 'desc' }
      });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      
      const due = booking.totalAmount - booking.paidAmount; // totalAmount is already in paise
      if (due <= 0) return NextResponse.json({ error: 'No pending dues' }, { status: 400 });
      
      if (_clientAmount && _clientAmount > 0 && _clientAmount <= due) {
          calculatedAmountPaise = _clientAmount;
      } else {
          calculatedAmountPaise = due;
      }

    } else if (type === 'cabin_renewal') {
      const booking = await db.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking || booking.studentId !== resolvedStudentId) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      
      const settings = await db.setting.findMany({
        where: { 
          key: { 
            in: ['cabin_reserved_rate', 'cabin_morning_shift_rate', 'cabin_day_shift_rate', 'cabin_night_shift_rate'] 
          } 
        }
      });
      const getSetting = (key: string, def: number) => {
        const s = settings.find((s) => s.key === key);
        return s ? parseInt(s.value, 10) : def;
      };
      
      let rate = 0;
      if (booking.type === 'reserved') rate = getSetting('cabin_reserved_rate', 1100);
      else if (booking.type === 'morning_shift') rate = getSetting('cabin_morning_shift_rate', 500);
      else if (booking.type === 'day_shift') rate = getSetting('cabin_day_shift_rate', 800);
      else if (booking.type === 'night_shift') rate = getSetting('cabin_night_shift_rate', 800);
      
      calculatedAmountPaise = rate * 100; // Convert to paise
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!calculatedAmountPaise || calculatedAmountPaise <= 0) {
      return NextResponse.json(
        { error: 'Invalid calculated amount' },
        { status: 400 }
      );
    }
    
    const order = await createRazorpayOrder(calculatedAmountPaise, receipt, orderNotes);

    return NextResponse.json({ orderId: order.id }, { status: 200 });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
