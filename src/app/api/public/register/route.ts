import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/public/register - Public: student self-registration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address, courseId } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    // Validate phone format (basic)
    const phoneStr = phone.trim();
    if (!/^[6-9]\d{9}$/.test(phoneStr)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400 }
      );
    }

    // Check for duplicate phone
    const existing = await db.student.findUnique({
      where: { phone: phoneStr },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A student with this phone number is already registered. Please contact the center.' },
        { status: 409 }
      );
    }

    // Create the student with source "website"
    const student = await db.student.create({
      data: {
        name: name.trim(),
        phone: phoneStr,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: 'Registered via website',
        source: 'website',
      },
    });

    // If a course was selected, create an enrollment
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId, status: 'active' },
      });

      if (course) {
        const startDate = new Date();
        const endDate = new Date();
        // Default duration: 6 months from now if no course duration specified
        endDate.setMonth(endDate.getMonth() + 6);

        await db.enrollment.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            startDate,
            endDate,
            totalFee: course.totalFee,
            paidAmount: 0,
            status: 'pending',
            notes: 'Self-enrolled via website - awaiting confirmation',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! We will contact you shortly.',
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
      },
    });
  } catch (error) {
    console.error('Error registering student:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again later.' },
      { status: 500 }
    );
  }
}
