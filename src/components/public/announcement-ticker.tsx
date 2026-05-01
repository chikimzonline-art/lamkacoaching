'use client';

import { useEffect, useState, useSyncExternalStore, useCallback } from 'react';
import { X, Megaphone } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

// Helper to read dismissed state from localStorage (client-safe)
function getTickerDismissed(): boolean {
  try {
    return localStorage.getItem('ticker-dismissed') === 'true';
  } catch {
    return false;
  }
}

// Subscribe to storage events for cross-tab sync
function subscribeToStorage(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export default function AnnouncementTicker() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [locallyDismissed, setLocallyDismissed] = useState(false);

  // useSyncExternalStore for hydration-safe mounted check
  const mounted = useSyncExternalStore(
    (cb) => { cb(); return () => {}; },
    () => true,
    () => false,
  );

  // useSyncExternalStore for localStorage dismissed state
  const storageDismissed = useSyncExternalStore(
    subscribeToStorage,
    getTickerDismissed,
    () => false, // server: not dismissed
  );

  // Fetch pinned notices
  useEffect(() => {
    fetch('/api/public/notices')
      .then((r) => r.json())
      .then((data) => {
        const pinned = (data.notices || []).filter((n: Notice) => n.pinned);
        setNotices(pinned);
      })
      .catch(() => {
        // Silently fail
      });
  }, []);

  const handleDismiss = useCallback(() => {
    setLocallyDismissed(true);
    try {
      localStorage.setItem('ticker-dismissed', 'true');
    } catch {
      // localStorage not available
    }
  }, []);

  // Don't render if dismissed via button or localStorage
  const isDismissed = locallyDismissed || storageDismissed;
  if (!mounted || isDismissed) return null;

  // Build the ticker text from pinned notices or default
  const tickerText =
    notices.length > 0
      ? notices.map((n) => `${n.title}${n.content ? ' — ' + n.content.slice(0, 80) : ''}`).join('   ●   ')
      : '🔥 New batches starting soon! Enroll now.   ●   Admissions Open 2025-26 — Register today!';

  return (
    <div className="relative h-9 bg-gradient-to-r from-cyan-600 to-sky-600 dark:from-cyan-700 dark:to-sky-700 overflow-hidden z-50">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-cyan-600 dark:from-cyan-700 to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-10 top-0 bottom-0 w-12 bg-gradient-to-l from-sky-600 dark:from-sky-700 to-transparent z-10 pointer-events-none" />

      {/* Megaphone icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center">
        <Megaphone className="h-3.5 w-3.5 text-white/80" />
      </div>

      {/* Scrolling text container */}
      <div
        className="absolute inset-0 flex items-center pl-10"
        onMouseEnter={(e) => {
          const el = e.currentTarget.querySelector('.animate-marquee') as HTMLElement;
          if (el) el.style.animationPlayState = 'paused';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget.querySelector('.animate-marquee') as HTMLElement;
          if (el) el.style.animationPlayState = 'running';
        }}
      >
        <div className="animate-marquee will-change-transform whitespace-nowrap">
          {/* Duplicate content for seamless loop */}
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide">
            {tickerText}
          </span>
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide ml-16">
            {tickerText}
          </span>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  );
}
