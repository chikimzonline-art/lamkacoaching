'use client';

import { useEffect, useState } from 'react';
import PublicLayout from '@/components/public/public-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Megaphone,
  Pin,
  Calendar,
  Inbox,
  Loader2,
} from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return formatDate(date);
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/notices')
      .then((r) => r.json())
      .then((data) => setNotices(data.notices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pinnedNotices = notices.filter((n) => n.pinned);
  const regularNotices = notices.filter((n) => !n.pinned);

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-orange-600 to-amber-500 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Notice Board</h1>
          <p className="mt-2 text-orange-100 text-lg max-w-xl mx-auto">
            Stay updated with the latest announcements, schedules, and important information
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <Skeleton className="h-5 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && notices.length === 0 && (
            <div className="text-center py-20">
              <Inbox className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Notices Yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                There are no announcements at the moment. Check back later for updates.
              </p>
            </div>
          )}

          {/* Pinned Notices */}
          {!loading && pinnedNotices.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Pin className="h-4 w-4 text-orange-600" />
                <h2 className="text-sm font-semibold text-orange-700 uppercase tracking-wider">Pinned</h2>
              </div>
              <div className="space-y-4">
                {pinnedNotices.map((notice) => (
                  <Card
                    key={notice.id}
                    className="border-l-4 border-l-orange-500 border-0 shadow-sm bg-orange-50/30"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5">
                          <Pin className="h-2.5 w-2.5 mr-0.5" /> Important
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(notice.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{notice.title}</h3>
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(notice.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Regular Notices */}
          {!loading && regularNotices.length > 0 && (
            <div>
              {pinnedNotices.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="h-4 w-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent</h2>
                </div>
              )}
              <div className="space-y-4">
                {regularNotices.map((notice) => (
                  <Card key={notice.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(notice.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{notice.title}</h3>
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(notice.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
