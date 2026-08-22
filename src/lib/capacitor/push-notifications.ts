import { PushNotifications } from '@capacitor/push-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { isNativePlatform } from './bridge';

/**
 * Creates and registers Android Notification Channels with customized sound & vibration profiles.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // 1. Urgent Notices & Holidays Channel
    await PushNotifications.createChannel({
      id: 'channel_urgent',
      name: 'Urgent Notices & Holidays',
      description: 'Important announcements, center holidays, and emergency notices',
      importance: 5, // High priority (Heads-up banner)
      visibility: 1, // Public on lockscreen
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#06b6d4',
    });

    // 2. Class Schedule Channel
    await PushNotifications.createChannel({
      id: 'channel_schedule',
      name: 'Class Timetable & Reminders',
      description: 'Daily class schedule alerts and batch updates',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });

    // 3. Cabin Bookings & Renewals Channel
    await PushNotifications.createChannel({
      id: 'channel_cabins',
      name: 'Cabin Bookings & Renewals',
      description: 'Cabin reservation confirmations, 3-day renewal alerts, and expiry warnings',
      importance: 3,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });

    // 4. Fees & Billing Channel
    await PushNotifications.createChannel({
      id: 'channel_billing',
      name: 'Fees & Payment Receipts',
      description: 'Fee payment confirmations, receipts, and due date reminders',
      importance: 3,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });

    // 5. Support Tickets Channel
    await PushNotifications.createChannel({
      id: 'channel_support',
      name: 'Support Ticket Replies',
      description: 'Responses from coaching center staff regarding your support queries',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
  } catch (err) {
    console.warn('[PushNotifications] Failed to create notification channels', err);
  }
}

/**
 * Initializes Push Notifications, requests permissions, and captures FCM token.
 */
export async function initPushNotifications(onNavigate?: (url: string) => void): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await setupNotificationChannels();

    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      const requested = await PushNotifications.requestPermissions();
      if (requested.receive !== 'granted') return;
    } else if (permStatus.receive !== 'granted') {
      return;
    }

    await PushNotifications.register();

    // Listen for FCM Device Registration Token
    await PushNotifications.addListener('registration', async (token) => {
      try {
        await fetch('/api/notifications/register-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcmToken: token.value,
            platform: 'android',
          }),
        });
      } catch (err) {
        console.warn('[PushNotifications] Failed to send token to server', err);
      }
    });

    // Handle Push Notification Received while app is in foreground
    await PushNotifications.addListener('pushNotificationReceived', async () => {
      try {
        await Badge.increase();
      } catch {
        // Ignore badge error
      }
    });

    // Handle Push Notification Tap (Deep Link Navigation)
    await PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
      try {
        await Badge.clear();
      } catch {
        // Ignore
      }

      const data = action.notification.data;
      const targetUrl = data?.url || data?.link || (data?.noticeId ? '/dashboard/notices' : null);

      if (targetUrl && onNavigate) {
        onNavigate(targetUrl);
      }
    });
  } catch (err) {
    console.warn('[PushNotifications] Initialization error', err);
  }
}
