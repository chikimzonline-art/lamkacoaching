import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Empty or invalid JSON body' }, { status: 400 });
    }

    const { fcmToken, platform = 'android' } = body || {};

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'Invalid FCM token' }, { status: 400 });
    }

    // Upsert student device token
    await (db as any).studentDevice.upsert({
      where: { fcmToken },
      update: {
        studentId: user.id,
        platform,
        updatedAt: new Date(),
      },
      create: {
        studentId: user.id,
        fcmToken,
        platform,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering device token:', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}
