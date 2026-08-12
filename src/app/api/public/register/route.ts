import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/public/register - Public: student self-registration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, password } = body;

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Name, phone number, email, and password are required' },
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
    const existingPhone = await db.student.findUnique({
      where: { phone: phoneStr },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'A student with this phone number is already registered.' },
        { status: 409 }
      );
    }

    // Check for duplicate email
    const existingEmail = await db.student.findFirst({
      where: { email: email.trim() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'A student with this email address is already registered.' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the student with source "website"
    const student = await db.student.create({
      data: {
        name: name.trim(),
        phone: phoneStr,
        email: email.trim(),
        username: phoneStr, // Set username to phone by default
        password: hashedPassword,
        notes: 'Registered via website auth',
        source: 'website',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        email: student.email,
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
