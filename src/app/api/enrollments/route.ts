import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/enrollments (staff/admin)
export async function GET(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

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

// POST /api/enrollments (staff/admin)
export async function POST(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, id, studentId, courseId, startDate, endDate, totalFee, paidAmount, notes, status,
            // Payment at enrollment
            payNow, payAmount, payMode, payReceiptNo, receiptNo, paymentDate, receivedAt } = body;

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
          startDate: new Date(startDate || Date.now()),
          endDate: endDate ? new Date(endDate) : null,
          totalFee: Math.round(Number(totalFee) * 100),
          paidAmount: enrollmentPaidAmount,
          notes: notes || null,
          status: status || 'active',
        },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          course: {
            select: { id: true, name: true, department: { select: { id: true, name: true } } },
          },
        },
      });

      // If initial payment was made at enrollment, create payment record atomically
      let payment: any = null;
      if (enrollmentPaidAmount > 0) {
        const receivedDate = paymentDate
          ? new Date(paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00`)
          : (receivedAt ? new Date(receivedAt) : new Date());

        payment = await db.enrollmentPayment.create({
          data: {
            enrollmentId: enrollment.id,
            studentId: studentId.toString(),
            amount: enrollmentPaidAmount,
            mode: payMode || 'cash',
            status: 'completed',
            receivedAt: receivedDate,
            notes: notes || 'Payment at enrollment',
            receiptNo: payReceiptNo || receiptNo || null,
          },
        });
      }

      await logAudit({
        user: auth.user,
        action: 'ENROLLMENT_CREATED',
        entityType: 'Enrollment',
        entityId: enrollment.id,
        description: `Enrolled student '${enrollment.student?.name || studentId}' into course '${enrollment.course?.name}' (Fee: ₹${enrollment.totalFee / 100})`,
        details: { enrollmentId: enrollment.id, studentId, courseId, totalFee: enrollment.totalFee / 100, paidAmount: enrollmentPaidAmount / 100 },
        req: request,
      });

      return NextResponse.json({ enrollment, payment });

    } else if (action === 'recordPayment') {
      if (!id || !payAmount || !payMode) {
        return NextResponse.json({ error: 'Enrollment ID, amount, and payment mode are required' }, { status: 400 });
      }

      const paymentAmount = Math.round(Number(payAmount) * 100);

      // Get enrollment to find studentId
      const enrollment = await db.enrollment.findUnique({
        where: { id },
        include: { student: { select: { name: true } }, course: { select: { name: true } } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
      }

      if (paymentAmount > (enrollment.totalFee - enrollment.paidAmount)) {
        return NextResponse.json({ error: 'Payment amount exceeds outstanding fee' }, { status: 400 });
      }

      const receivedDate = paymentDate
        ? new Date(paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00`)
        : (receivedAt ? new Date(receivedAt) : new Date());

      // Create payment
      const payment = await db.enrollmentPayment.create({
        data: {
          enrollmentId: id,
          studentId: enrollment.studentId,
          amount: paymentAmount,
          mode: payMode,
          status: 'completed',
          receivedAt: receivedDate,
          notes: notes || null,
          receiptNo: receiptNo || null,
        },
      });

      // Update enrollment paid amount
      await db.enrollment.update({
        where: { id },
        data: { paidAmount: { increment: paymentAmount } },
      });

      await logAudit({
        user: auth.user,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `Recorded ${payMode.toUpperCase()} course fee of ₹${paymentAmount / 100} for student '${enrollment.student?.name || enrollment.studentId}' (Course: ${enrollment.course?.name})`,
        details: { paymentId: payment.id, enrollmentId: id, studentId: enrollment.studentId, amount: paymentAmount / 100, mode: payMode, receiptNo },
        req: request,
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

    } else if (action === 'active' || action === 'activate') {
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const enrollment = await db.enrollment.update({
        where: { id },
        data: { status: 'active' },
        include: {
          student: { select: { id: true, name: true, phone: true } },
          course: { select: { id: true, name: true, department: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ enrollment });

    } else if (action === 'delete') {
      if (auth.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can delete enrollments' }, { status: 403 });
      }

      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      const existing = await db.enrollment.findUnique({
        where: { id },
        include: { student: { select: { name: true } }, course: { select: { name: true } } },
      });
      if (!existing) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

      await db.enrollment.delete({ where: { id } });

      await logAudit({
        user: auth.user,
        action: 'ENROLLMENT_DELETED',
        entityType: 'Enrollment',
        entityId: id,
        description: `Deleted enrollment record #${id} for student '${existing?.student?.name || 'N/A'}' (Course: ${existing?.course?.name})`,
        details: { enrollmentId: id, studentId: existing?.studentId, courseId: existing?.courseId },
        req: request,
      });

      return NextResponse.json({ success: true, message: 'Enrollment deleted successfully' });

    } else if (action === 'deletePayment') {
      if (auth.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can delete payments' }, { status: 403 });
      }

      // Delete an enrollment payment
      const { paymentId } = body;
      if (!paymentId) return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      const payment = await db.enrollmentPayment.findUnique({
        where: { id: paymentId },
        include: { student: { select: { name: true } } },
      });
      if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

      // Update enrollment paid amount
      await db.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { paidAmount: { decrement: payment.amount } },
      });

      await db.enrollmentPayment.delete({ where: { id: paymentId } });

      await logAudit({
        user: auth.user,
        action: 'PAYMENT_DELETED',
        entityType: 'Payment',
        entityId: paymentId,
        description: `Deleted course payment #${paymentId} (₹${payment.amount / 100}) for student '${payment.student?.name || payment.studentId}'`,
        details: { paymentId, amount: payment.amount / 100, studentId: payment.studentId },
        req: request,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing enrollment:', error);
    return NextResponse.json({ error: 'Failed to process enrollment request' }, { status: 500 });
  }
}

// DELETE /api/enrollments?id=xxx (admin only)
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const enrollment = await db.enrollment.findUnique({
      where: { id },
      include: { student: { select: { name: true } }, course: { select: { name: true } } },
    });
    if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

    await db.enrollment.delete({ where: { id } });

    await logAudit({
      user: auth.user,
      action: 'ENROLLMENT_DELETED',
      entityType: 'Enrollment',
      entityId: id,
      description: `Deleted enrollment #${id} for student '${enrollment.student?.name || enrollment.studentId}'`,
      details: { enrollmentId: id, studentId: enrollment.studentId },
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 });
  }
}
