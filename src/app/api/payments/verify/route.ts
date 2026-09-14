import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { env } from '@/env';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, paymentId, signature, type, itemId, bookingId } = body;

    if (!orderId || !paymentId || !type) {
      return NextResponse.json({ error: 'Missing orderId, paymentId, or type' }, { status: 400 });
    }

    // 1. Signature Verification
    const isMock = paymentId.startsWith('pay_mock_') && process.env.NODE_ENV !== 'production';
    if (!isMock) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing payment signature' }, { status: 400 });
      }
      const secret = env.RAZORPAY_KEY_SECRET;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('[PaymentVerify] Invalid signature. Expected:', expectedSignature, 'Got:', signature);
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    const resolvedStudentId = (user.role === 'admin' || user.role === 'staff')
      ? (body.studentId || user.id)
      : user.id;

    // 2. Handle Cabin Booking Verification
    if (type === 'cabin') {
      const booking = await db.booking.findFirst({
        where: bookingId
          ? { id: bookingId, studentId: resolvedStudentId }
          : { cabinId: itemId, studentId: resolvedStudentId, status: { in: ['pending_payment', 'expired', 'active'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
      }

      // Check idempotency - has this payment already been recorded?
      const existingPayment = await db.payment.findFirst({
        where: { transactionId: paymentId },
      });

      if (existingPayment) {
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          bookingId: booking.id,
          paymentId: existingPayment.id,
        });
      }

      const amountToCredit = booking.totalAmount - booking.paidAmount;

      await db.$transaction([
        db.payment.create({
          data: {
            bookingId: booking.id,
            studentId: resolvedStudentId,
            amount: amountToCredit > 0 ? amountToCredit : booking.totalAmount,
            mode: 'razorpay',
            transactionId: paymentId,
            notes: `Verified via Client ${isMock ? '(Developer Mock)' : '(Razorpay)'}`,
            status: 'completed',
            receivedAt: new Date(),
          },
        }),
        db.booking.update({
          where: { id: booking.id },
          data: {
            paidAmount: booking.totalAmount,
            status: 'active',
          },
        }),
      ]);

      revalidatePath('/dashboard/cabins');
      revalidatePath('/dashboard/my-learning');
      revalidatePath('/cabins');

      return NextResponse.json({
        success: true,
        message: 'Cabin booking activated successfully',
        bookingId: booking.id,
        paymentId,
      });
    }

    // 3. Handle Course Enrollment Verification
    if (type === 'course') {
      const enrollment = await db.enrollment.findFirst({
        where: {
          studentId: resolvedStudentId,
          courseId: itemId,
          status: { in: ['pending_payment', 'active'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment record not found' }, { status: 404 });
      }

      const existingPayment = await db.enrollmentPayment.findFirst({
        where: { transactionId: paymentId },
      });

      if (existingPayment) {
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          enrollmentId: enrollment.id,
          paymentId: existingPayment.id,
        });
      }

      const due = (enrollment.totalFee - enrollment.paidAmount) * 100; // in paise
      const amountToCredit = due > 0 ? due : enrollment.totalFee * 100;

      await db.$transaction([
        db.enrollmentPayment.create({
          data: {
            enrollmentId: enrollment.id,
            studentId: resolvedStudentId,
            amount: amountToCredit,
            mode: 'razorpay',
            transactionId: paymentId,
            notes: `Verified via Client ${isMock ? '(Developer Mock)' : '(Razorpay)'}`,
            status: 'completed',
            receivedAt: new Date(),
          },
        }),
        db.enrollment.update({
          where: { id: enrollment.id },
          data: {
            paidAmount: enrollment.totalFee,
            status: 'active',
          },
        }),
      ]);

      revalidatePath('/dashboard/my-learning');
      revalidatePath('/dashboard/courses');

      return NextResponse.json({
        success: true,
        message: 'Course enrollment activated successfully',
        enrollmentId: enrollment.id,
        paymentId,
      });
    }

    // 4. Handle Cabin Renewal Verification
    if (type === 'cabin_renewal') {
      const targetBookingId = bookingId || itemId;
      if (!targetBookingId) {
        return NextResponse.json({ error: 'Missing bookingId for renewal' }, { status: 400 });
      }

      const booking = await db.booking.findUnique({
        where: { id: targetBookingId },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
      }

      if (booking.studentId !== resolvedStudentId && user.role !== 'admin' && user.role !== 'staff') {
        return NextResponse.json({ error: 'Unauthorized to renew this booking' }, { status: 403 });
      }

      const existingPayment = await db.payment.findFirst({
        where: { transactionId: paymentId },
      });

      if (existingPayment) {
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          bookingId: booking.id,
          paymentId: existingPayment.id,
        });
      }

      // Calculate new end date (+1 month)
      const currentEnd = booking.endDate ? new Date(booking.endDate) : new Date(booking.startDate);
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + 1);
      newEnd.setHours(23, 59, 59, 999);

      // Determine renewal fee in paise
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

      let renewRate = 0;
      if (booking.type === 'reserved') renewRate = getSetting('cabin_reserved_rate', 1100);
      else if (booking.type === 'morning_shift') renewRate = getSetting('cabin_morning_shift_rate', 500);
      else if (booking.type === 'day_shift') renewRate = getSetting('cabin_day_shift_rate', 800);
      else if (booking.type === 'night_shift') renewRate = getSetting('cabin_night_shift_rate', 800);

      const renewalAmountPaise = renewRate * 100;

      await db.$transaction([
        db.payment.create({
          data: {
            bookingId: booking.id,
            studentId: resolvedStudentId,
            amount: renewalAmountPaise,
            mode: 'razorpay',
            transactionId: paymentId,
            notes: `Verified via Client ${isMock ? '(Developer Mock)' : '(Razorpay Renewal)'}`,
            status: 'completed',
            receivedAt: new Date(),
          },
        }),
        db.booking.update({
          where: { id: booking.id },
          data: {
            paidAmount: { increment: renewalAmountPaise },
            totalAmount: { increment: renewalAmountPaise },
            endDate: newEnd,
            status: 'active',
          },
        }),
      ]);

      revalidatePath('/dashboard/cabins');
      revalidatePath('/cabins');

      return NextResponse.json({
        success: true,
        message: 'Cabin booking renewed successfully for +1 month',
        bookingId: booking.id,
        paymentId,
      });
    }

    return NextResponse.json({ error: 'Unsupported payment type' }, { status: 400 });
  } catch (error: any) {
    console.error('[PaymentVerify] Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while verifying payment.' },
      { status: 500 }
    );
  }
}
