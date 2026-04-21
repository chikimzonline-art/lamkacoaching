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

// GET /api/payments - List payments (both booking and enrollment)
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const bookingId = searchParams.get('bookingId');

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (bookingId) where.bookingId = bookingId;

    // Fetch booking payments
    const bookingPayments = await db.payment.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { receivedAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        booking: {
          select: {
            id: true,
            type: true,
            totalAmount: true,
            cabin: { select: { cabinNum: true } },
          },
        },
      },
    });

    // Fetch enrollment payments
    const enrollmentWhere: Record<string, unknown> = {};
    if (studentId) enrollmentWhere.studentId = studentId;

    const enrollmentPayments = await db.enrollmentPayment.findMany({
      where: Object.keys(enrollmentWhere).length > 0 ? enrollmentWhere : undefined,
      orderBy: { receivedAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        enrollment: {
          select: {
            id: true,
            course: { select: { name: true, department: { select: { name: true } } } },
          },
        },
      },
    });

    // Normalize into unified format
    const payments = [
      ...bookingPayments.map((p) => ({
        id: p.id,
        type: 'booking' as const,
        studentId: p.studentId,
        amount: p.amount,
        mode: p.mode,
        status: p.status,
        receivedAt: p.receivedAt,
        notes: p.notes,
        student: p.student,
        booking: p.booking,
      })),
      ...enrollmentPayments.map((p) => ({
        id: p.id,
        type: 'enrollment' as const,
        studentId: p.studentId,
        amount: p.amount,
        mode: p.mode,
        status: p.status,
        receivedAt: p.receivedAt,
        notes: p.notes,
        student: p.student,
        enrollment: p.enrollment,
      })),
    ].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments - Record payment
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, bookingId, studentId, amount, mode, notes } = body;

    if (action === 'create') {
      if (!bookingId || !studentId || !amount || !mode) {
        return NextResponse.json({ error: 'Booking ID, student ID, amount, and payment mode are required' }, { status: 400 });
      }

      const paymentAmount = Math.round(Number(amount) * 100); // convert to paise

      // Create payment
      const payment = await db.payment.create({
        data: {
          bookingId,
          studentId,
          amount: paymentAmount,
          mode,
          status: 'completed',
          notes: notes || null,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          booking: {
            select: {
              id: true,
              type: true,
              totalAmount: true,
              paidAmount: true,
              cabin: { select: { cabinNum: true } },
            },
          },
        },
      });

      // Update booking paid amount
      await db.booking.update({
        where: { id: bookingId },
        data: { paidAmount: { increment: paymentAmount } },
      });

      return NextResponse.json({ payment });

    } else if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      }

      const payment = await db.payment.findUnique({ where: { id } });
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      // Update booking paid amount
      await db.booking.update({
        where: { id: payment.bookingId },
        data: { paidAmount: { decrement: payment.amount } },
      });

      await db.payment.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing payment request:', error);
    return NextResponse.json({ error: 'Failed to process payment request' }, { status: 500 });
  }
}
