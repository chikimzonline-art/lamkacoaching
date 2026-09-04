import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  return handleDeleteAccount(req);
}

export async function DELETE(req: NextRequest) {
  return handleDeleteAccount(req);
}

async function handleDeleteAccount(req: NextRequest) {
  try {
    const sessionUser = await getAuthUser();
    const body = await req.json().catch(() => ({}));
    const { password, identifier } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required to confirm account deletion' },
        { status: 400 }
      );
    }

    // Identify target student
    let student: any = null;
    if (sessionUser?.id) {
      student = await db.student.findUnique({
        where: { id: sessionUser.id },
      });
    } else if (identifier && typeof identifier === 'string') {
      student = await db.student.findFirst({
        where: {
          OR: [
            { username: identifier.trim() },
            { phone: identifier.trim() },
            { email: identifier.trim() },
          ],
        },
      });
    }

    if (!student) {
      return NextResponse.json(
        { error: 'Student account not found or session expired' },
        { status: 404 }
      );
    }

    // Verify student password
    if (!student.password) {
      return NextResponse.json(
        { error: 'No password set for this account. Please contact administration for assistance.' },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Account deletion aborted.' },
        { status: 400 }
      );
    }

    // Log the deletion in audit logs prior to cascading deletion
    await logAudit({
      user: {
        id: student.id,
        name: student.name,
        username: student.username || student.phone,
        role: 'student',
      },
      action: 'STUDENT_SELF_DELETED',
      entityType: 'Student',
      entityId: student.id,
      description: `Student '${student.name}' (${student.phone}) permanently deleted their account and personal data`,
      details: {
        studentId: student.id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        deletedAt: new Date().toISOString(),
      },
      req,
    });

    // Cascade delete student record (removes bookings, enrollments, payments, devices, etc.)
    await db.student.delete({
      where: { id: student.id },
    });

    // Create response and clear authentication cookies
    const response = NextResponse.json({
      success: true,
      message: 'Your account and personal data have been permanently deleted.',
    });

    // Clear session cookies
    response.cookies.set('next-auth.session-token', '', {
      path: '/',
      expires: new Date(0),
    });
    response.cookies.set('__Secure-next-auth.session-token', '', {
      path: '/',
      expires: new Date(0),
      secure: true,
    });

    return response;
  } catch (error) {
    console.error('Error deleting student account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
