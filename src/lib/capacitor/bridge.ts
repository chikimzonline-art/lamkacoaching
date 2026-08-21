import { Capacitor } from '@capacitor/core';

/**
 * Checks whether the app is currently running in a native Android wrapper.
 */
export function isNativeAndroid(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Checks whether the app is running in any native mobile wrapper (Android / iOS).
 */
export function isNativePlatform(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Gets the current runtime platform ('web', 'android', 'ios').
 */
export function getPlatformName(): string {
  if (typeof window === 'undefined') return 'server';
  return Capacitor.getPlatform();
}
