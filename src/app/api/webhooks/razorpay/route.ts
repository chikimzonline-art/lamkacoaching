import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text(); // Get raw body text for signature validation
    
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: 'Invalid signature or secret' }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid Razorpay signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Signature is valid, parse body to JSON
    const event = JSON.parse(bodyText);

    // Depending on the event type
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const orderEntity = event.payload.order?.entity;
      
      // Notes are passed during order creation (e.g., studentId, type, courseId, cabinId)
      const notes = paymentEntity.notes || orderEntity?.notes || {};
      const amountPaid = paymentEntity.amount; // already in paise
      
      const { studentId, type, itemId } = notes;

      if (!studentId || !type) {
        console.warn('Webhook received but missing metadata in notes');
        return NextResponse.json({ success: true, message: 'No action taken (missing metadata)' });
      }

      // Handle Course Fee Payment
      if (type === 'course') {
        // Find existing enrollment
        const enrollment = await db.enrollment.findFirst({
          where: { 
            studentId: studentId, 
            courseId: itemId, 
            status: { in: ['active', 'pending_payment'] } 
          },
        });

        if (enrollment) {
          // Check for idempotency
          const existingPayment = await db.enrollmentPayment.findFirst({
            where: { notes: { contains: paymentEntity.id } }
          });

          if (existingPayment) {
             return NextResponse.json({ success: true, message: 'Payment already processed' });
          }

          // Add payment record and update enrollment paidAmount
          await db.$transaction([
            db.enrollmentPayment.create({
              data: {
                enrollmentId: enrollment.id,
                studentId: studentId,
                amount: amountPaid,
                mode: 'razorpay',
                notes: `Razorpay Payment ID: ${paymentEntity.id}`,
                status: 'completed',
              }
            }),
            db.enrollment.update({
              where: { id: enrollment.id },
              data: { 
                paidAmount: { increment: amountPaid },
                status: 'active' // upgrade status from pending_payment if necessary
              }
            })
          ]);
        }
      } 
      // Handle Cabin Booking Payment
      else if (type === 'cabin') {
        // Find existing booking
        const booking = await db.booking.findFirst({
          where: { studentId: studentId, cabinId: itemId, status: 'active' },
        });

        if (booking) {
          // Check for idempotency
          const existingPayment = await db.payment.findFirst({
            where: { notes: { contains: paymentEntity.id } }
          });

          if (existingPayment) {
             return NextResponse.json({ success: true, message: 'Payment already processed' });
          }

          await db.$transaction([
            db.payment.create({
              data: {
                bookingId: booking.id,
                studentId: studentId,
                amount: amountPaid,
                mode: 'razorpay',
                notes: `Razorpay Payment ID: ${paymentEntity.id}`,
                status: 'completed',
              }
            }),
            db.booking.update({
              where: { id: booking.id },
              data: { paidAmount: { increment: amountPaid } }
            })
          ]);
        }
      }
    }

    // Always return 200 OK to Razorpay so it doesn't retry
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
