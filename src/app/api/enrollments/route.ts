import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/enrollments
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    else where.status = 'active';

    if (departmentId) {
      where.course = { departmentId };
    }

    // Fetch list and aggregated stats in one roundtrip
    const [enrollments, statsData] = await db.$transaction([
      db.enrollment.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          course: {
            select: { id: true, name: true, department: { select: { id: true, name: true } } },
          },
          payments: {
            select: { id: true, amount: true, mode: true, receivedAt: true, notes: true, receiptNo: true },
            orderBy: { receivedAt: 'desc' },
          },
        },
      }),
      db.enrollment.aggregate({
        where: { status: 'active' },
        _count: { _all: true },
        _sum: { totalFee: true, paidAmount: true },
      })
    ]);

    return NextResponse.json({
      enrollments,
      stats: {
        totalActive: statsData._count._all,
        totalFees: statsData._sum.totalFee || 0,
        totalPaid: statsData._sum.paidAmount || 0,
        totalOutstanding: (statsData._sum.totalFee || 0) - (statsData._sum.paidAmount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// POST /api/enrollments
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, id, studentId, courseId, startDate, endDate, totalFee, paidAmount, notes, status,
            // Payment at enrollment
            payNow, payAmount, payMode, payReceiptNo, receiptNo } = body;

    if (action === 'create') {
      if (!studentId || !courseId || !totalFee || !body.batchId) {
        return NextResponse.json({ error: 'Student, course, batch and total fee are required' }, { status: 400 });
      }

      const enrollmentPaidAmount = payNow && payAmount ? Math.round(Number(payAmount) * 100) : 0;

      const enrollment = await db.enrollment.create({
        data: {
          studentId: studentId.toString(),
          courseId: courseId.toString(),
          batchId: body.batchId.toString(),
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          totalFee: Math.round(Number(totalFee) * 100),
          paidAmount: enrollmentPaidAmount,
          notes: notes || null,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          course: { select: { id: true, name: true, department: { select: { name: true } } } },
          payments: true,
        },
      });

      // Create payment record if payNow
      if (payNow && enrollmentPaidAmount > 0) {
        await db.enrollmentPayment.create({
          data: {
            enrollmentId: enrollment.id,
            studentId,
            amount: enrollmentPaidAmount,
            mode: payMode || 'cash',
            status: 'completed',
            notes: 'Payment at enrollment',
            receiptNo: payReceiptNo || null,
          },
        });
      }

      return NextResponse.json({ enrollment });

    } else if (action === 'recordPayment') {
      if (!id || !payAmount || !payMode) {
        return NextResponse.json({ error: 'Enrollment ID, amount, and payment mode are required' }, { status: 400 });
      }

      const paymentAmount = Math.round(Number(payAmount) * 100);

      // Get enrollment to find studentId
      const enrollment = await db.enrollment.findUnique({ where: { id } });
      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
      }

      if (paymentAmount > (enrollment.totalFee - enrollment.paidAmount)) {
        return NextResponse.json({ error: 'Payment amount exceeds outstanding fee' }, { status: 400 });
      }

      // Create payment
      const payment = await db.enrollmentPayment.create({
        data: {
          enrollmentId: id,
          studentId: enrollment.studentId,
          amount: paymentAmount,
          mode: payMode,
          status: 'completed',
          notes: notes || null,
          receiptNo: receiptNo || null,
        },
      });

      // Update enrollment paid amount
      await db.enrollment.update({
        where: { id },
        data: { paidAmount: { increment: paymentAmount } },
      });

      return NextResponse.json({ payment });

    } else if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const enrollment = await db.enrollment.update({
        where: { id },
        data: {
          notes: notes !== undefined ? notes : undefined,
          totalFee: totalFee !== undefined ? Math.round(Number(totalFee) * 100) : undefined,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          course: { select: { id: true, name: true, department: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ enrollment });

    } else if (action === 'complete') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const enrollment = await db.enrollment.update({
        where: { id },
        data: { status: 'completed' },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          course: { select: { id: true, name: true, department: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ enrollment });

    } else if (action === 'drop') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const enrollment = await db.enrollment.update({
        where: { id },
        data: { status: 'dropped' },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          course: { select: { id: true, name: true, department: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ enrollment });

    } else if (action === 'deletePayment') {
      // Delete an enrollment payment
      const { paymentId } = body;
      if (!paymentId) return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      const payment = await db.enrollmentPayment.findUnique({ where: { id: paymentId } });
      if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

      // Update enrollment paid amount
      await db.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { paidAmount: { decrement: payment.amount } },
      });

      await db.enrollmentPayment.delete({ where: { id: paymentId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing enrollment:', error);
    return NextResponse.json({ error: 'Failed to process enrollment request' }, { status: 500 });
  }
}
