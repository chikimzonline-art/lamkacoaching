import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await db.student.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        email: true,
        address: true,
        avatar: true,
        source: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return handleUpdateProfile(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdateProfile(req);
}

async function handleUpdateProfile(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { phone, email, address } = body;

    const currentStudent = await db.student.findUnique({
      where: { id: user.id },
    });

    if (!currentStudent) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    // Validate and prepare phone update
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (!trimmedPhone) {
        return NextResponse.json({ error: 'Phone number cannot be empty' }, { status: 400 });
      }

      if (trimmedPhone !== currentStudent.phone) {
        const existingPhone = await db.student.findFirst({
          where: {
            phone: trimmedPhone,
            id: { not: user.id },
          },
        });
        if (existingPhone) {
          return NextResponse.json(
            { error: 'This phone number is already registered with another student account' },
            { status: 409 }
          );
        }
        updateData.phone = trimmedPhone;
      }
    }

    // Validate and prepare email update
    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      updateData.email = trimmedEmail || null;
    }

    // Validate and prepare address update
    if (address !== undefined) {
      const trimmedAddress = String(address).trim();
      updateData.address = trimmedAddress || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected',
        student: currentStudent,
      });
    }

    const updatedStudent = await db.student.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        email: true,
        address: true,
        avatar: true,
        createdAt: true,
      },
    });

    await logAudit({
      user: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        username: updatedStudent.username || updatedStudent.phone,
        role: 'student',
      },
      action: 'STUDENT_PROFILE_UPDATED',
      entityType: 'Student',
      entityId: updatedStudent.id,
      description: `Student '${updatedStudent.name}' updated their contact details`,
      details: updateData,
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
