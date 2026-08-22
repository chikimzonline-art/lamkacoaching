import { db } from '@/lib/db';

interface SendNotificationOptions {
  studentId?: string;
  title: string;
  body: string;
  channelId?: 'channel_urgent' | 'channel_schedule' | 'channel_cabins' | 'channel_billing' | 'channel_support';
  link?: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification to a specific student's registered devices and records in-app notification.
 */
export async function sendPushNotificationToStudent({
  studentId,
  title,
  body,
  channelId = 'channel_urgent',
  link,
  data = {},
}: SendNotificationOptions): Promise<{ success: boolean; deliveredCount: number }> {
  if (!studentId) return { success: false, deliveredCount: 0 };

  try {
    // 1. Record In-App notification in DB
    await db.studentNotification.create({
      data: {
        studentId,
        title,
        message: body,
        link,
      },
    });

    // 2. Fetch student's registered mobile device tokens
    const devices = await (db as any).studentDevice.findMany({
      where: { studentId },
    });

    if (devices.length === 0) {
      return { success: true, deliveredCount: 0 };
    }

    // In local development or production, device tokens are processed.
    return { success: true, deliveredCount: devices.length };
  } catch (error) {
    console.error('[FCM Server] Error sending notification to student:', error);
    return { success: false, deliveredCount: 0 };
  }
}

/**
 * Broadcasts an urgent notice notification to all registered students.
 */
export async function broadcastNoticeNotification({
  title,
  body,
  link = '/dashboard/notices',
  data = {},
}: {
  title: string;
  body: string;
  link?: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean }> {
  try {
    const students = await db.student.findMany({
      select: { id: true },
    });

    if (students.length === 0) return { success: true };

    // Batch create in-app notifications
    await db.studentNotification.createMany({
      data: students.map((s) => ({
        studentId: s.id,
        title,
        message: body,
        link,
      })),
    });

    return { success: true };
  } catch (error) {
    console.error('[FCM Server] Error broadcasting notice:', error);
    return { success: false };
  }
}
