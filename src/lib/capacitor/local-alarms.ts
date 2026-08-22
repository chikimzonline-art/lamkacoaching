import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './bridge';

// Notification ID ranges
const TIMETABLE_ALARM_BASE_ID = 10000;
const CABIN_RENEWAL_ALARM_BASE_ID = 20000;
const CABIN_EXPIRY_ALARM_BASE_ID = 30000;

/**
 * Requests local notification permissions on Android (required for Android 13+).
 */
export async function requestLocalNotificationPermissions(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  } catch (err) {
    console.warn('[LocalAlarms] Failed to request permissions', err);
    return false;
  }
}

/**
 * Parses time string like "07:00 AM - 08:30 AM", "7:00 AM", or "6:30 PM".
 * Returns { hour24, minute }
 */
function parseStartTime(timingStr: string): { hour: number; minute: number } | null {
  if (!timingStr) return null;

  try {
    const parts = timingStr.split(/[-–—]/);
    const startStr = parts[0]?.trim() || timingStr.trim();
    const match = startStr.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);

    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const modifier = match[3]?.toUpperCase();

    if (modifier === 'PM' && hour < 12) hour += 12;
    if (modifier === 'AM' && hour === 12) hour = 0;

    return { hour, minute };
  } catch {
    return null;
  }
}

/**
 * Synchronizes offline 30-minute advance class timetable alarms for active enrolled batches.
 * Recurring every Monday to Saturday directly inside Android AlarmManager.
 */
export async function syncTimetableAlarms(activeEnrollments: any[]): Promise<void> {
  if (!isNativePlatform() || !activeEnrollments || activeEnrollments.length === 0) return;

  try {
    const hasPermission = await requestLocalNotificationPermissions();
    if (!hasPermission) return;

    // 1. Cancel previous timetable alarms
    const pending = await LocalNotifications.getPending();
    const oldTimetableAlarms = pending.notifications
      .filter((n) => n.id >= TIMETABLE_ALARM_BASE_ID && n.id < CABIN_RENEWAL_ALARM_BASE_ID)
      .map((n) => ({ id: n.id }));

    if (oldTimetableAlarms.length > 0) {
      await LocalNotifications.cancel({ notifications: oldTimetableAlarms });
    }

    const notificationsToSchedule: any[] = [];
    let alarmIndex = 0;

    // Monday (2) to Saturday (7) in LocalNotifications Schedule weekday indexing
    const classWeekdays = [2, 3, 4, 5, 6, 7]; // Mon=2, Tue=3, Wed=4, Thu=5, Fri=6, Sat=7

    for (const enr of activeEnrollments) {
      const batch = enr.batch;
      const course = enr.course;
      if (!batch || !batch.timing) continue;

      const parsedTime = parseStartTime(batch.timing);
      if (!parsedTime) continue;

      // Compute 30 minutes before class start
      let alarmHour = parsedTime.hour;
      let alarmMinute = parsedTime.minute - 30;

      if (alarmMinute < 0) {
        alarmMinute += 60;
        alarmHour -= 1;
        if (alarmHour < 0) alarmHour = 23;
      }

      for (const weekday of classWeekdays) {
        const notificationId = TIMETABLE_ALARM_BASE_ID + alarmIndex;
        alarmIndex++;

        notificationsToSchedule.push({
          id: notificationId,
          title: `🔔 Upcoming Class in 30 Mins`,
          body: `${batch.batchName || course?.name || 'Class'} starts at ${batch.timing.split(/[-–—]/)[0]?.trim()}.`,
          channelId: 'channel_schedule',
          schedule: {
            on: {
              weekday,
              hour: alarmHour,
              minute: alarmMinute,
            },
            allowWhileIdle: true,
          },
          extra: {
            url: '/dashboard/schedule',
          },
          sound: 'beep.wav',
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (err) {
    console.warn('[LocalAlarms] Error synchronizing timetable alarms', err);
  }
}

/**
 * Schedules a local notification 3 days before a monthly cabin booking ends.
 */
export async function scheduleCabinRenewalAlarm(
  bookingId: string,
  cabinNum: number,
  endDate: string | Date
): Promise<void> {
  if (!isNativePlatform() || !endDate) return;

  try {
    const end = new Date(endDate);
    // 3 days prior at 10:00 AM
    const reminderDate = new Date(end);
    reminderDate.setDate(reminderDate.getDate() - 3);
    reminderDate.setHours(10, 0, 0, 0);

    // Only schedule if the date is in the future
    if (reminderDate.getTime() > Date.now()) {
      const id = CABIN_RENEWAL_ALARM_BASE_ID + Math.abs(bookingId.charCodeAt(0) || 1);

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: '⏳ Cabin Booking Renewal Alert',
            body: `Your Cabin #${cabinNum} reservation expires in 3 days. Tap to renew online or visit the office counter.`,
            channelId: 'channel_cabins',
            schedule: {
              at: reminderDate,
              allowWhileIdle: true,
            },
            extra: {
              url: '/dashboard/cabins',
            },
          },
        ],
      });
    }
  } catch (err) {
    console.warn('[LocalAlarms] Failed to schedule cabin renewal alarm', err);
  }
}

/**
 * Schedules a 15-minute countdown alert before a short study cabin session expires.
 */
export async function scheduleCabinSessionEndAlarm(
  cabinNum: number,
  endTimeStr: string
): Promise<void> {
  if (!isNativePlatform() || !endTimeStr) return;

  try {
    const parsed = parseStartTime(endTimeStr);
    if (!parsed) return;

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setHours(parsed.hour, parsed.minute, 0, 0);

    // 15 minutes before end time
    const alertTime = new Date(targetDate.getTime() - 15 * 60 * 1000);

    if (alertTime.getTime() > Date.now()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: CABIN_EXPIRY_ALARM_BASE_ID + cabinNum,
            title: '⏰ Study Session Ending Soon',
            body: `Your study time in Cabin #${cabinNum} ends in 15 minutes. Tap to extend if needed.`,
            channelId: 'channel_cabins',
            schedule: {
              at: alertTime,
              allowWhileIdle: true,
            },
            extra: {
              url: '/dashboard/cabins',
            },
          },
        ],
      });
    }
  } catch (err) {
    console.warn('[LocalAlarms] Failed to schedule cabin session end alarm', err);
  }
}
