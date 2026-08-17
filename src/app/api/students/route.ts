import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

// GET /api/students - List students with FTS5 search + grouped balances (no N+1)
// Query params:
//   search    - FTS5 MATCH term (name/email) OR substring on phone/username
//   bookings  - "true" to include active bookings with cabin info
//   take      - page size (default 20, max 100)
//   skip      - offset for pagination / load-more
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      if (!name || !phone) {
        return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
      }
      const existing = await db.student.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json({ error: 'A student with this phone number already exists' }, { status: 400 });
      }

      if (username) {
        const existingUsername = await db.student.findUnique({ where: { username } });
        if (existingUsername) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }
      }

      let hashedPassword: string | null = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const student = await db.student.create({
        data: { name, username: username || null, phone, email: email || null, address: address || null, notes: notes || null, password: hashedPassword },
      });
      return NextResponse.json({ student });

    } else if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
      }

      if (username) {
        const existingUsername = await db.student.findUnique({ where: { username } });
        if (existingUsername && existingUsername.id !== id) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }
      }

      const updateData: any = {
        name: name || undefined,
        username: username !== undefined ? (username || null) : undefined,
        phone: phone || undefined,
        email: email !== undefined ? email : undefined,
        address: address !== undefined ? address : undefined,
        notes: notes !== undefined ? notes : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const student = await db.student.update({
        where: { id },
        data: updateData,
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
