import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, subject, message } = body;

    // Validation
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!/^\d{10}$/.test(phone.trim())) return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    // Save to database
    await db.contactSubmission.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        subject: subject || null,
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, message: 'Your message has been received. We will contact you shortly.' });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
