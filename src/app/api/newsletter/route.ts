import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      if (existing.active) {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 409 }
        );
      }
      // Reactivate inactive subscriber
      await db.newsletterSubscriber.update({
        where: { email: trimmedEmail },
        data: { active: true },
      });
      return NextResponse.json({
        success: true,
        message: 'You have been resubscribed successfully!',
      });
    }

    // Save to database
    await db.newsletterSubscriber.create({
      data: { email: trimmedEmail },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing to our newsletter!',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
