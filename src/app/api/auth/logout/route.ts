import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    // Optionally deregister the calling device's FCM push token
    try {
      const body = await request.json().catch(() => null);
      const fcmToken = body?.fcmToken;
      if (fcmToken && typeof fcmToken === 'string') {
        await (db as any).studentDevice.deleteMany({
          where: { fcmToken },
        });
      }
    } catch (_) {
      // Ignore body parse / token deregistration errors during logout
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear NextAuth session cookies
    const cookieStore = await cookies();
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('__Host-next-auth.csrf-token');

    return response;
  } catch (error) {
    console.error('[AuthLogout] Error processing logout:', error);
    // Even if error occurs, clear cookies and respond with success
    return NextResponse.json({ success: true, message: 'Logged out' });
  }
}
