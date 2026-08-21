import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireStaffOrAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

// GET /api/payments - List payments (staff/admin)
export async function GET(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const bookingId = searchParams.get('bookingId');

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (bookingId) where.bookingId = bookingId;

    // Fetch both types of payments in one roundtrip
    const enrollmentWhere: Record<string, unknown> = {};
    if (studentId) enrollmentWhere.studentId = studentId;

    const [bookingPayments, enrollmentPayments] = await db.$transaction([
      db.payment.findMany({
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
      }
      }),

      db.enrollmentPayment.findMany({
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
      }),
    ]);

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
        receiptNo: p.receiptNo,
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
        receiptNo: p.receiptNo,
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
    const { action, id, paymentType, bookingId, studentId, amount, mode, notes, receiptNo, paymentDate, receivedAt } = body;

    if (action === 'create') {
      if (user.role !== 'admin' && user.role !== 'staff') {
        return NextResponse.json({ error: 'Forbidden: Only staff and admins can record payments' }, { status: 403 });
      }

      if (!bookingId || !studentId || !amount || !mode) {
        return NextResponse.json({ error: 'Booking ID, student ID, amount, and payment mode are required' }, { status: 400 });
      }

      const paymentAmount = Math.round(Number(amount) * 100); // convert to paise

      const receivedDate = paymentDate
        ? new Date(paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00`)
        : (receivedAt ? new Date(receivedAt) : new Date());

      // Create payment and update booking paid amount atomically
      const [payment] = await db.$transaction([
        db.payment.create({
          data: {
            bookingId,
            studentId,
            amount: paymentAmount,
            mode,
            status: 'completed',
            receivedAt: receivedDate,
            notes: notes || null,
            receiptNo: receiptNo || null,
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
        }),
        db.booking.update({
          where: { id: bookingId },
          data: { paidAmount: { increment: paymentAmount } },
        })
      ]);

      revalidatePath('/dashboard/history');
      revalidatePath('/dashboard/my-learning');
      revalidatePath('/dashboard/cabins');

      await logAudit({
        user,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `Recorded ${payment.mode.toUpperCase()} payment of ₹${paymentAmount / 100} for student '${payment.student?.name || studentId}' (Receipt: ${receiptNo || 'N/A'})`,
        details: {
          paymentId: payment.id,
          bookingId,
          studentId,
          studentName: payment.student?.name,
          amount: paymentAmount / 100,
          mode,
          receiptNo,
          notes,
        },
        req: request,
      });

      return NextResponse.json({ payment });

    } else if (action === 'delete') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can delete payment records' }, { status: 403 });
      }

      if (!id) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      }

      // Try booking payment first
      const bookingPayment = await db.payment.findUnique({
        where: { id },
        include: { student: { select: { name: true } } },
      });
      if (bookingPayment) {
        await db.$transaction([
          db.booking.update({
            where: { id: bookingPayment.bookingId },
            data: { paidAmount: { decrement: bookingPayment.amount } },
          }),
          db.payment.delete({ where: { id } })
        ]);
        
        revalidatePath('/dashboard/history');
        revalidatePath('/dashboard/my-learning');
        revalidatePath('/dashboard/cabins');

        await logAudit({
          user,
          action: 'PAYMENT_DELETED',
          entityType: 'Payment',
          entityId: id,
          description: `Deleted cabin payment record #${id} (₹${bookingPayment.amount / 100}) for student '${bookingPayment.student?.name || bookingPayment.studentId}'`,
          details: { paymentId: id, amount: bookingPayment.amount / 100, studentId: bookingPayment.studentId },
          req: request,
        });
        
        return NextResponse.json({ success: true, type: 'booking' });
      }

      // Try enrollment payment
      const enrollmentPayment = await db.enrollmentPayment.findUnique({
        where: { id },
        include: { student: { select: { name: true } } },
      });
      if (enrollmentPayment) {
        await db.$transaction([
          db.enrollment.update({
            where: { id: enrollmentPayment.enrollmentId },
            data: { paidAmount: { decrement: enrollmentPayment.amount } },
          }),
          db.enrollmentPayment.delete({ where: { id } })
        ]);
        
        revalidatePath('/dashboard/history');
        revalidatePath('/dashboard/my-learning');
        revalidatePath('/dashboard/courses');

        await logAudit({
          user,
          action: 'PAYMENT_DELETED',
          entityType: 'Payment',
          entityId: id,
          description: `Deleted enrollment payment record #${id} (₹${enrollmentPayment.amount / 100}) for student '${enrollmentPayment.student?.name || enrollmentPayment.studentId}'`,
          details: { paymentId: id, amount: enrollmentPayment.amount / 100, studentId: enrollmentPayment.studentId },
          req: request,
        });
        
        return NextResponse.json({ success: true, type: 'enrollment' });
      }

      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing payment request:', error);
    return NextResponse.json({ error: 'Failed to process payment request' }, { status: 500 });
  }
}
