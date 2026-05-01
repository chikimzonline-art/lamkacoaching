import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, subject, message } = body;

    // Validation
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!/^\d{10}$/.test(phone.trim())) return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    // In production, you would send an email or save to database here
    // For now, we just log and return success
    console.log('Contact form submission:', { name, phone, email, subject, message });

    return NextResponse.json({ success: true, message: 'Your message has been received. We will contact you shortly.' });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
