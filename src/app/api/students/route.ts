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

// GET /api/students - List all students with search
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const includeBookings = searchParams.get('bookings') === 'true';

    const students = await db.student.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' },
      include: includeBookings ? {
        bookings: {
          where: { status: 'active' },
          include: {
            cabin: { select: { id: true, cabinNum: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      } : undefined,
    });

    // Get balance due for each student (both bookings and enrollments)
    const studentsWithBalance = await Promise.all(students.map(async (student) => {
      const bookings = await db.booking.findMany({
        where: { studentId: student.id, status: 'active' },
        select: { totalAmount: true, paidAmount: true },
      });
      const enrollments = await db.enrollment.findMany({
        where: { studentId: student.id, status: 'active' },
        select: { totalFee: true, paidAmount: true },
      });

      const bookingDue = bookings.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);
      const bookingPaid = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
      const bookingTotal = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

      const enrollmentDue = enrollments.reduce((sum, e) => sum + (e.totalFee - e.paidAmount), 0);
      const enrollmentPaid = enrollments.reduce((sum, e) => sum + e.paidAmount, 0);
      const enrollmentTotal = enrollments.reduce((sum, e) => sum + e.totalFee, 0);

      return {
        ...student,
        totalDue: bookingDue + enrollmentDue,
        totalPaid: bookingPaid + enrollmentPaid,
        totalAmount: bookingTotal + enrollmentTotal,
        activeBookingCount: bookings.length,
        activeEnrollmentCount: enrollments.length,
      };
    }));

    return NextResponse.json({ students: studentsWithBalance });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// POST /api/students - Create/update/delete students
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, name, phone, email, address, notes } = body;

    if (action === 'create') {
      if (!name || !phone) {
        return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
      }
      const existing = await db.student.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json({ error: 'A student with this phone number already exists' }, { status: 400 });
      }
      const student = await db.student.create({
        data: { name, phone, email: email || null, address: address || null, notes: notes || null },
      });
      return NextResponse.json({ student });

    } else if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
      }
      const student = await db.student.update({
        where: { id },
        data: {
          name: name || undefined,
          phone: phone || undefined,
          email: email !== undefined ? email : undefined,
          address: address !== undefined ? address : undefined,
          notes: notes !== undefined ? notes : undefined,
        },
      });
      return NextResponse.json({ student });

    } else if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
      }
      const activeBookings = await db.booking.count({
        where: { studentId: id, status: 'active' },
      });
      const activeEnrollments = await db.enrollment.count({
        where: { studentId: id, status: 'active' },
      });
      if (activeBookings > 0 || activeEnrollments > 0) {
        return NextResponse.json({ error: `Cannot delete student with active bookings (${activeBookings}) or enrollments (${activeEnrollments})` }, { status: 400 });
      }
      await db.student.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing student request:', error);
    return NextResponse.json({ error: 'Failed to process student request' }, { status: 500 });
  }
}
