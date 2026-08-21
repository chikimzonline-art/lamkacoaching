'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, CheckCheck, ChevronRight, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok && isMounted) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      }
    };
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async (id: string) => {
    // Remove locally immediately for instant feedback
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    await markAsRead(n.id);

    // If notification has a specific direct destination (other than root /dashboard)
    if (n.link && n.link !== '/dashboard' && n.link !== '') {
      setPopoverOpen(false);
      router.push(n.link);
    } else {
      // Open in-place detail modal for notices / announcements without external links
      setSelectedNotification(n);
      setPopoverOpen(false);
      setDetailModalOpen(true);
    }
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors"
            aria-label="Notifications"
          >
            {unreadCount > 0 ? (
              <>
                <BellRing className="h-5 w-5 animate-pulse text-indigo-600" />
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 ring-2 ring-white"></span>
                </span>
              </>
            ) : (
              <Bell className="h-5 w-5 text-slate-500" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-xl border border-slate-200/90 rounded-2xl overflow-hidden bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 px-2 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Body */}
          <ScrollArea className="max-h-80 min-h-[160px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="rounded-full bg-emerald-50 p-3 mb-2.5 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="font-semibold text-sm text-slate-800">You&apos;re all caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No new unread notifications right now.</p>
                <Link
                  href="/dashboard/notices"
                  onClick={() => setPopoverOpen(false)}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  View Announcements <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group space-y-1.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        {n.link && n.link !== '/dashboard' ? 'View & Enroll' : 'View details'}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                      <span className="text-[10px] text-slate-400">Click to view & dismiss</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
              <Link
                href="/dashboard/notices"
                onClick={() => setPopoverOpen(false)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                View all announcements →
              </Link>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Notification In-Place Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl p-6">
          {selectedNotification && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(selectedNotification.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedNotification.title}
                </DialogTitle>
                <DialogDescription className="hidden">Notification Details</DialogDescription>
              </DialogHeader>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => setDetailModalOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-4 h-9"
                >
                  Got it
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
