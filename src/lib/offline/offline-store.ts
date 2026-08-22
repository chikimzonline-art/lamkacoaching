'use client';

export type OfflineCacheKey =
  | 'schedule'
  | 'notices'
  | 'my_learning'
  | 'notifications'
  | 'student_profile';

export interface OfflineCacheEnvelope<T> {
  key: OfflineCacheKey;
  version: number;
  timestamp: number; // Date.now()
  data: T;
}

export interface OfflineCacheResult<T> {
  data: T | null;
  timestamp: number | null;
  isAvailable: boolean;
  formattedTime: string | null;
}

const STORAGE_PREFIX = 'lamka_offline_';
const CACHE_VERSION = 1;

/**
 * Saves data to client-side offline storage.
 */
export function saveOfflineData<T>(key: OfflineCacheKey, data: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const envelope: OfflineCacheEnvelope<T> = {
      key,
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    };
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(envelope));
    return true;
  } catch (err) {
    console.warn(`[OfflineStore] Failed to save cache for key "${key}":`, err);
    return false;
  }
}

/**
 * Retrieves cached data from offline storage.
 */
export function getOfflineData<T>(key: OfflineCacheKey): OfflineCacheResult<T> {
  if (typeof window === 'undefined') {
    return { data: null, timestamp: null, isAvailable: false, formattedTime: null };
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) {
      return { data: null, timestamp: null, isAvailable: false, formattedTime: null };
    }

    const envelope: OfflineCacheEnvelope<T> = JSON.parse(raw);
    if (!envelope || !envelope.timestamp) {
      return { data: null, timestamp: null, isAvailable: false, formattedTime: null };
    }

    const formattedTime = new Date(envelope.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });

    return {
      data: envelope.data,
      timestamp: envelope.timestamp,
      isAvailable: true,
      formattedTime,
    };
  } catch (err) {
    console.warn(`[OfflineStore] Failed to retrieve cache for key "${key}":`, err);
    return { data: null, timestamp: null, isAvailable: false, formattedTime: null };
  }
}

/**
 * Clears offline cache for a specific key or all offline keys.
 */
export function clearOfflineCache(key?: OfflineCacheKey): void {
  if (typeof window === 'undefined') return;
  try {
    if (key) {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('[OfflineStore] Failed to clear offline cache:', err);
  }
}
