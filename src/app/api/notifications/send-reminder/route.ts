import { NextRequest, NextResponse } from 'next/server';
import { requireStaffOrAdmin } from '@/lib/auth';
import { sendPushNotificationToStudent } from '@/lib/fcm-server';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { studentId, amount, customMessage } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const title = '💳 Fee Payment Reminder';
    const message =
      customMessage ||
      (amount
        ? `You have a pending balance of ₹${amount.toLocaleString('en-IN')}. Tap to pay online via UPI or visit the office counter.`
        : 'You have pending fee dues. Please tap to view details and complete your payment.');

    const result = await sendPushNotificationToStudent({
      studentId,
      title,
      body: message,
      channelId: 'channel_billing',
      link: '/dashboard/history',
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending fee reminder:', error);
    return NextResponse.json({ error: 'Failed to send fee reminder' }, { status: 500 });
  }
}
