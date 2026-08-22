import { Badge } from '@capawesome/capacitor-badge';
import { isNativePlatform } from './bridge';

/**
 * Checks if launcher badge count is supported on this device/launcher.
 */
export async function isBadgeSupported(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const { isSupported } = await Badge.isSupported();
    return isSupported;
  } catch {
    return false;
  }
}

/**
 * Gets the current launcher badge count.
 */
export async function getBadgeCount(): Promise<number> {
  if (!isNativePlatform()) return 0;
  try {
    const { count } = await Badge.get();
    return count || 0;
  } catch (err) {
    console.warn('[BadgeManager] Failed to get badge count:', err);
    return 0;
  }
}

/**
 * Sets the badge count on the Android launcher icon.
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const targetCount = Math.max(0, Math.floor(count));
    if (targetCount === 0) {
      await Badge.clear();
    } else {
      await Badge.set({ count: targetCount });
    }
    return true;
  } catch (err) {
    console.warn('[BadgeManager] Failed to set badge count:', err);
    return false;
  }
}

/**
 * Clears the launcher icon badge completely.
 */
export async function clearBadge(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    await Badge.clear();
    return true;
  } catch (err) {
    console.warn('[BadgeManager] Failed to clear badge:', err);
    return false;
  }
}

/**
 * Increments the current launcher badge counter by 1.
 */
export async function incrementBadge(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    await Badge.increase();
    return true;
  } catch (err) {
    console.warn('[BadgeManager] Failed to increment badge:', err);
    return false;
  }
}

/**
 * Decrements the current launcher badge counter by 1.
 */
export async function decrementBadge(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    await Badge.decrease();
    return true;
  } catch (err) {
    console.warn('[BadgeManager] Failed to decrement badge:', err);
    return false;
  }
}

/**
 * Syncs the native badge count with the current unread count from the backend.
 */
export async function syncBadgeFromUnreadCount(unreadCount: number): Promise<void> {
  if (!isNativePlatform()) return;
  await setBadgeCount(unreadCount);
}
