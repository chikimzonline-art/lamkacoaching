import { registerPlugin } from '@capacitor/core';
import { isNativePlatform } from './bridge';

export interface SecurityPluginInterface {
  enableSecureScreen(): Promise<{ secured: boolean }>;
  disableSecureScreen(): Promise<{ secured: boolean }>;
  isSecureScreenEnabled(): Promise<{ secured: boolean }>;
}

const NativeSecurity = registerPlugin<SecurityPluginInterface>('Security');

/**
 * Enables Android FLAG_SECURE on the native window.
 * Blocks screenshots, screen recording, and hides content in Android app switcher preview.
 */
export async function enableSecureScreen(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const res = await NativeSecurity.enableSecureScreen();
    return res?.secured ?? true;
  } catch (err) {
    console.warn('[Security] Failed to enable secure screen:', err);
    return false;
  }
}

/**
 * Disables Android FLAG_SECURE on the native window.
 */
export async function disableSecureScreen(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const res = await NativeSecurity.disableSecureScreen();
    return !(res?.secured ?? false);
  } catch (err) {
    console.warn('[Security] Failed to disable secure screen:', err);
    return false;
  }
}

/**
 * Checks whether FLAG_SECURE is currently active on the window.
 */
export async function isSecureScreenEnabled(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const res = await NativeSecurity.isSecureScreenEnabled();
    return res?.secured ?? false;
  } catch {
    return false;
  }
}
