import { isNativePlatform } from './bridge';

/**
 * Keeps the screen awake (prevents auto-sleep) during active study sessions.
 */
export async function setKeepScreenAwake(enable: boolean): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake');
    if (enable) {
      await KeepAwake.keepAwake();
    } else {
      await KeepAwake.allowSleep();
    }
  } catch (err) {
    console.warn('[ScreenManager] Failed to toggle keep-awake', err);
  }
}

/**
 * Returns whether the keep-awake feature is supported on this device.
 */
export async function isScreenAwakeSupported(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake');
    const result = await KeepAwake.isSupported();
    return result.isSupported;
  } catch {
    return false;
  }
}
