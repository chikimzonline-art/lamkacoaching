import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from './bridge';

/**
 * Safe Haptic Feedback utilities for Android.
 * Safely no-ops when executed in standard web browsers.
 */
export const hapticFeedback = {
  /**
   * Light tactile tap (ideal for button clicks, tab navigation, list selection)
   */
  async light(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore if not supported
    }
  },

  /**
   * Medium tactile tap (ideal for cabin selection, toggling filters, opening dialogs)
   */
  async medium(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Ignore if not supported
    }
  },

  /**
   * Heavy tactile impact (ideal for critical actions like deletion, confirmation)
   */
  async heavy(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Ignore if not supported
    }
  },

  /**
   * Success notification vibration pattern (ideal for payment success, booking confirmed, attendance verified)
   */
  async success(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Ignore if not supported
    }
  },

  /**
   * Error notification vibration pattern (ideal for form errors, failed bookings)
   */
  async error(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Ignore if not supported
    }
  },

  /**
   * Selection change feedback (ideal for scrolling wheel pickers, sliders)
   */
  async selectionChanged(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await Haptics.selectionChanged();
    } catch {
      // Ignore if not supported
    }
  }
};
