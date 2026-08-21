import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin, requireStaffOrAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { generateSecurePassword, generateUsernameSlug, sendStudentCredentialsEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';

// GET /api/students - List students with FTS5 search + grouped balances (staff/admin)
// Query params:
//   search    - FTS5 MATCH term (name/email) OR substring on phone/username
//   bookings  - "true" to include active bookings with cabin info
//   take      - page size (default 20, max 100)
//   skip      - offset for pagination / load-more
export async function GET(request: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const includeBookings = searchParams.get('bookings') === 'true';

    const take = Math.min(Math.max(parseInt(searchParams.get('take') || '20', 10) || 20, 1), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0);

    // --- Search via FTS5 (name/email) + LIKE substring (phone/username) ---
    // FTS5 is tokenized — great for names/emails. Phone/username stay on LIKE
    // because users type arbitrary substrings (e.g. "9876" inside "9876543210").
    let students: any[];

    if (search) {
      // Sanitize the FTS5 term: wrap each whitespace-separated token as a
      // prefix query (token*). Escape double quotes for the FTS5 string.
      const ftsTerm = search
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => `"${tok.replace(/"/g, '""')}"*`)
        .join(' ');

      const phonePattern = `%${search}%`;

      // UNION of FTS5 matches (name/email) and LIKE matches (phone/username).
      // ORDER BY createdAt desc to preserve previous behaviour; LIMIT/OFFSET
      // apply on the unioned set.
      students = await db.$queryRaw<any[]>(
        Prisma.sql`
          SELECT * FROM Student
          WHERE rowid IN (
            SELECT rowid FROM Student_fts WHERE Student_fts MATCH ${ftsTerm}
          )
          UNION
          SELECT * FROM Student
          WHERE phone LIKE ${phonePattern} OR username LIKE ${phonePattern}
          ORDER BY createdAt DESC
          LIMIT ${take} OFFSET ${skip}
        `
      );
    } else {
      students = await db.student.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: includeBookings
          ? {
              bookings: {
                where: { status: 'active' },
                include: { cabin: { select: { id: true, cabinNum: true } } },
                orderBy: { createdAt: 'desc' },
              },
            }
          : undefined,
      });
    }

    // --- Balances via 2 grouped aggregates (replaces 2N N+1 queries) ---
    const studentIds = students.map((s) => s.id);
    let bookingAgg: any[] = [];
    let enrollmentAgg: any[] = [];

    if (studentIds.length > 0) {
      // Batch both aggregates in a single HTTP round-trip via $transaction.
      [bookingAgg, enrollmentAgg] = await db.$transaction([
        db.booking.groupBy({
          by: ['studentId'],
          where: { studentId: { in: studentIds }, status: 'active' },
          _sum: { totalAmount: true, paidAmount: true },
          _count: { _all: true },
        }),
        db.enrollment.groupBy({
          by: ['studentId'],
          where: { studentId: { in: studentIds }, status: 'active' },
          _sum: { totalFee: true, paidAmount: true },
          _count: { _all: true },
        }),
      ]);
    }

    const bookingMap = new Map<string, { due: number; paid: number; total: number; count: number }>();
    for (const b of bookingAgg) {
      const total = b._sum.totalAmount ?? 0;
      const paid = b._sum.paidAmount ?? 0;
      bookingMap.set(b.studentId, {
        total,
        paid,
        due: total - paid,
        count: b._count._all,
      });
    }

    const enrollmentMap = new Map<string, { due: number; paid: number; total: number; count: number }>();
    for (const e of enrollmentAgg) {
      const total = e._sum.totalFee ?? 0;
      const paid = e._sum.paidAmount ?? 0;
      enrollmentMap.set(e.studentId, {
        total,
        paid,
        due: total - paid,
        count: e._count._all,
      });
    }

    const studentsWithBalance = students.map((student) => {
      const b = bookingMap.get(student.id) ?? { due: 0, paid: 0, total: 0, count: 0 };
      const e = enrollmentMap.get(student.id) ?? { due: 0, paid: 0, total: 0, count: 0 };
      const { password, ...studentData } = student as any;
      return {
        ...studentData,
        hasLoginAccess: !!password,
        totalDue: b.due + e.due,
        totalPaid: b.paid + e.paid,
        totalAmount: b.total + e.total,
        activeBookingCount: b.count,
        activeEnrollmentCount: e.count,
      };
    });

    return NextResponse.json({
      students: studentsWithBalance,
      hasMore: students.length === take,
    });
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
    const { action, id, name, username, phone, email, address, notes, password, avatar } = body;

    if (action === 'create') {
      // Only staff and admin can create students
      if (user.role !== 'admin' && user.role !== 'staff') {
        return NextResponse.json({ error: 'Forbidden: Only staff and admins can register students' }, { status: 403 });
      }

      if (!name || !phone || !email) {
        return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 });
      }

      const cleanPhone = phone.trim().replace(/\s+/g, '');
      const cleanEmail = email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
      }

      const existingPhone = await db.student.findUnique({ where: { phone: cleanPhone } });
      if (existingPhone) {
        return NextResponse.json({ error: 'A student with this phone number already exists' }, { status: 400 });
      }

      // Generate or validate username
      let finalUsername = username ? username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') : generateUsernameSlug(name);
      
      let existingUsername = await db.student.findUnique({ where: { username: finalUsername } });
      if (existingUsername) {
        if (username) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }
        // Auto-resolve collision by appending last 4 digits of phone
        const phoneSuffix = cleanPhone.slice(-4);
        finalUsername = `${finalUsername}${phoneSuffix}`;
        existingUsername = await db.student.findUnique({ where: { username: finalUsername } });
        if (existingUsername) {
          finalUsername = cleanPhone;
        }
      }

      const plainPassword = password?.trim() || generateSecurePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const student = await db.student.create({
        data: {
          name: name.trim(),
          username: finalUsername,
          phone: cleanPhone,
          email: cleanEmail,
          address: address?.trim() || null,
          notes: notes?.trim() || null,
          password: hashedPassword,
        },
      });

      // Dispatch welcome credentials email asynchronously (non-blocking)
      let emailSent = false;
      try {
        const emailRes = await sendStudentCredentialsEmail({
          name: student.name,
          email: student.email!,
          phone: student.phone,
          username: student.username || student.phone,
          password: plainPassword,
        });
        emailSent = emailRes.success;
      } catch (err) {
        console.error('[Brevo] Failed to send credentials email:', err);
      }

      await logAudit({
        user,
        action: 'STUDENT_CREATED',
        entityType: 'Student',
        entityId: student.id,
        description: `Registered new student '${student.name}' (Phone: ${student.phone})`,
        details: { studentId: student.id, name: student.name, phone: student.phone, email: student.email, username: student.username },
        req: request,
      });

      return NextResponse.json({
        student,
        generatedPassword: plainPassword,
        emailSent,
      });

    } else if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
      }

      // Students can ONLY update their own record
      if (user.role === 'student' && user.id !== id) {
        return NextResponse.json({ error: 'Forbidden: You can only update your own profile' }, { status: 403 });
      }

      if (username) {
        const existingUsername = await db.student.findUnique({ where: { username } });
        if (existingUsername && existingUsername.id !== id) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }
      }

      // If student is updating own record, restrict fields they can change
      const updateData: any = {};
      if (user.role === 'admin' || user.role === 'staff') {
        if (name !== undefined) updateData.name = name;
        if (username !== undefined) updateData.username = username || null;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (address !== undefined) updateData.address = address;
        if (notes !== undefined) updateData.notes = notes;
        if (avatar !== undefined) updateData.avatar = avatar;
      } else {
        // Student role
        if (avatar !== undefined) updateData.avatar = avatar;
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const student = await db.student.update({
        where: { id },
        data: updateData,
      });

      await logAudit({
        user,
        action: 'STUDENT_UPDATED',
        entityType: 'Student',
        entityId: student.id,
        description: `Updated student profile for '${student.name}'`,
        details: { studentId: student.id, updatedFields: Object.keys(updateData) },
        req: request,
      });

      return NextResponse.json({ student });

    } else if (action === 'delete') {
      // ONLY ADMIN can delete student records
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only administrators can delete student records' }, { status: 403 });
      }

      if (!id) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
      }

      const existingStudent = await db.student.findUnique({ where: { id }, select: { name: true, phone: true } });
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

      await logAudit({
        user,
        action: 'STUDENT_DELETED',
        entityType: 'Student',
        entityId: id,
        description: `Deleted student record for '${existingStudent?.name || id}'`,
        details: { studentId: id, name: existingStudent?.name, phone: existingStudent?.phone },
        req: request,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing student request:', error);
    return NextResponse.json({ error: 'Failed to process student request' }, { status: 500 });
  }
}
