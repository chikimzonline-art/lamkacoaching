'use client';

import { useState } from 'react';
import PublicLayout from '@/components/public/public-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Megaphone, Pin, Calendar, Inbox, Search } from 'lucide-react';

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

export default function NoticesClient({ initialNotices }: { initialNotices: Notice[] }) {
  const [search, setSearch] = useState('');
  const notices = initialNotices;

  const query = search.toLowerCase().trim();
  const filteredNotices = query
    ? notices.filter(
        (n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
      )
    : notices;

  const pinnedNotices = filteredNotices.filter((n) => n.pinned);
  const regularNotices = filteredNotices.filter((n) => !n.pinned);
  const hasResults = filteredNotices.length > 0;

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-cyan-600 to-sky-500 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Notice Board</h1>
          <p className="mt-2 text-cyan-100 text-lg max-w-xl mx-auto">
            Stay updated with the latest announcements, schedules, and important information
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          {notices.length > 0 && (
            <div className="flex items-center gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {filteredNotices.length} notice{filteredNotices.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Empty State */}
          {notices.length === 0 && (
            <div className="text-center py-20">
              <Inbox className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Notices Yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                There are no announcements at the moment. Check back later for updates.
              </p>
            </div>
          )}

          {/* Search Empty State */}
          {notices.length > 0 && !hasResults && (
            <div className="text-center py-20">
              <Search className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No notices found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search terms</p>
            </div>
          )}

          {/* Pinned Notices */}
          {pinnedNotices.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Pin className="h-4 w-4 text-cyan-600" />
                <h2 className="text-sm font-semibold text-cyan-700 uppercase tracking-wider">Pinned</h2>
              </div>
              <div className="space-y-4">
                {pinnedNotices.map((notice) => (
                  <Card key={notice.id} className="border-l-4 border-l-cyan-500 border-0 shadow-sm bg-cyan-50/30 dark:bg-cyan-950/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-cyan-100 text-cyan-700 text-[10px] px-1.5">
                          <Pin className="h-2.5 w-2.5 mr-0.5" /> Important
                        </Badge>
                        <span className="text-xs text-gray-400">{formatRelativeTime(notice.createdAt)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2">{notice.title}</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{notice.content}</div>
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
          {regularNotices.length > 0 && (
            <div>
              {pinnedNotices.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="h-4 w-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent</h2>
                </div>
              )}
              <div className="space-y-4">
                {regularNotices.map((notice) => (
                  <Card key={notice.id} className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">{formatRelativeTime(notice.createdAt)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{notice.title}</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{notice.content}</div>
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
