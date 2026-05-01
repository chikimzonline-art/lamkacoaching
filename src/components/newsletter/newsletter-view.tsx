'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Search,
  RefreshCw,
  Trash2,
  Copy,
  Users,
  UserCheck,
  UserX,
  Inbox,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NewsletterData {
  subscribers: Subscriber[];
  total: number;
  page: number;
  totalPages: number;
  activeCount: number;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="rounded-xl border">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewsletterView() {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      const res = await fetch(`/api/newsletter?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Failed to load subscribers');
      }
    } catch {
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      setTogglingId(id);
      const res = await fetch(`/api/newsletter/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        const { subscriber } = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                subscribers: prev.subscribers.map((s) =>
                  s.id === id ? subscriber : s
                ),
                activeCount: prev.activeCount + (subscriber.active ? 1 : -1),
              }
            : prev
        );
        toast.success(
          subscriber.active
            ? 'Subscriber activated'
            : 'Subscriber deactivated'
        );
      } else {
        toast.error('Failed to update subscriber');
      }
    } catch {
      toast.error('Failed to update subscriber');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteSubscriber = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/newsletter/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                subscribers: prev.subscribers.filter((s) => s.id !== id),
                total: prev.total - 1,
                activeCount: prev.subscribers.find((s) => s.id === id)?.active
                  ? prev.activeCount - 1
                  : prev.activeCount,
              }
            : prev
        );
        toast.success('Subscriber deleted');
      } else {
        toast.error('Failed to delete subscriber');
      }
    } catch {
      toast.error('Failed to delete subscriber');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const exportEmails = async () => {
    try {
      setExporting(true);
      // Fetch all active subscribers for export
      const params = new URLSearchParams({ limit: '1000', page: '1' });
      const res = await fetch(`/api/newsletter?${params}`);
      if (res.ok) {
        const json = await res.json();
        const emails = json.subscribers
          .filter((s: Subscriber) => s.active)
          .map((s: Subscriber) => s.email)
          .join('\n');
        await navigator.clipboard.writeText(emails);
        toast.success(
          `${json.subscribers.filter((s: Subscriber) => s.active).length} emails copied to clipboard`
        );
      } else {
        toast.error('Failed to export emails');
      }
    } catch {
      toast.error('Failed to copy emails to clipboard');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && !data) return <LoadingSkeleton />;

  const subscribers = data?.subscribers || [];
  const total = data?.total || 0;
  const activeCount = data?.activeCount || 0;
  const inactiveCount = total - activeCount;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Newsletter Subscribers</h2>
          <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-0">
            {total} total
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportEmails}
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Export Emails
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscribers}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{inactiveCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Empty State */}
      {subscribers.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Inbox className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {debouncedSearch ? 'No subscribers found' : 'No subscribers yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {debouncedSearch
                ? 'Try adjusting your search query'
                : 'Newsletter subscriptions will appear here when users subscribe from the footer'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      {subscribers.length > 0 && (
        <>
          <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Subscribed On</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => (
                  <TableRow
                    key={sub.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {sub.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {formatDate(sub.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={sub.active}
                          onCheckedChange={() => toggleActive(sub.id, sub.active)}
                          disabled={togglingId === sub.id}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Badge
                          className={`border-0 text-xs font-medium ${
                            sub.active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {sub.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteId(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {subscribers.map((sub) => (
              <Card key={sub.id} className="dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                          {sub.email}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Subscribed {formatDate(sub.createdAt)}
                      </p>
                    </div>
                    <Badge
                      className={`border-0 text-xs shrink-0 ${
                        sub.active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {sub.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div
                    className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={sub.active}
                        onCheckedChange={() => toggleActive(sub.id, sub.active)}
                        disabled={togglingId === sub.id}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {sub.active ? 'Deactivate' : 'Activate'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                      onClick={() => setDeleteId(sub.id)}
                      disabled={togglingId === sub.id}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages} ({total} subscribers)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this subscriber? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteId && deleteSubscriber(deleteId)}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
