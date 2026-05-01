'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle2,
  Reply,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: {
    label: 'New',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <AlertCircle className="h-3 w-3 mr-1" />,
  },
  read: {
    label: 'Read',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <Eye className="h-3 w-3 mr-1" />,
  },
  replied: {
    label: 'Replied',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.new;
  return (
    <Badge variant="outline" className={`border-0 ${config.color} text-xs font-medium`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="rounded-xl border">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ContactView() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contact-submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      } else {
        toast.error('Failed to load submissions');
      }
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const updateStatus = async (id: string, status: string) => {
    try {
      setActionLoading(id);
      const res = await fetch('/api/contact-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
        toast.success(`Marked as ${status}`);
        if (selectedMessage?.id === id) {
          setSelectedMessage(updated);
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/contact-submissions?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        toast.success('Submission deleted');
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      } else {
        toast.error('Failed to delete submission');
      }
    } catch {
      toast.error('Failed to delete submission');
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  const newCount = submissions.filter((s) => s.status === 'new').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncate = (str: string, len: number) => {
    if (str.length <= len) return str;
    return str.slice(0, len) + '...';
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
          {newCount > 0 && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
              {newCount} new
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSubmissions}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Empty State */}
      {submissions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Inbox className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No messages yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Contact form submissions will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      {submissions.length > 0 && (
        <>
          <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Message</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow
                    key={sub.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    onClick={() => setSelectedMessage(sub)}
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {sub.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {sub.phone}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {sub.email || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {sub.subject || '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] text-gray-600 dark:text-gray-300">
                      {truncate(sub.message, 50)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(sub.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sub.status === 'new' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                            onClick={() => updateStatus(sub.id, 'read')}
                            disabled={actionLoading === sub.id}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Read</span>
                          </Button>
                        )}
                        {sub.status !== 'replied' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            onClick={() => updateStatus(sub.id, 'replied')}
                            disabled={actionLoading === sub.id}
                          >
                            <Reply className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Reply</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setDeleteId(sub.id)}
                          disabled={actionLoading === sub.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {submissions.map((sub) => (
              <Card
                key={sub.id}
                className="cursor-pointer hover:shadow-md transition-shadow dark:border-gray-700"
                onClick={() => setSelectedMessage(sub)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {sub.name}
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {sub.phone}
                        </span>
                        {sub.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {sub.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(sub.createdAt)}
                    </span>
                  </div>
                  {sub.subject && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                      {sub.subject}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {truncate(sub.message, 80)}
                  </p>
                  <div className="flex items-center gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                    {sub.status === 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => updateStatus(sub.id, 'read')}
                        disabled={actionLoading === sub.id}
                      >
                        <Eye className="h-3 w-3" />
                        Mark Read
                      </Button>
                    )}
                    {sub.status !== 'replied' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => updateStatus(sub.id, 'replied')}
                        disabled={actionLoading === sub.id}
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                      onClick={() => setDeleteId(sub.id)}
                      disabled={actionLoading === sub.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-600" />
              Message Details
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedMessage.status} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(selectedMessage.createdAt)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedMessage.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="text-sm font-medium text-cyan-600 hover:underline"
                  >
                    {selectedMessage.phone}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  {selectedMessage.email ? (
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-sm font-medium text-cyan-600 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedMessage.subject || '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
                {selectedMessage.status === 'new' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => updateStatus(selectedMessage.id, 'read')}
                    disabled={actionLoading === selectedMessage.id}
                  >
                    <Eye className="h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
                {selectedMessage.status !== 'replied' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => updateStatus(selectedMessage.id, 'replied')}
                    disabled={actionLoading === selectedMessage.id}
                  >
                    <Reply className="h-4 w-4" />
                    Mark as Replied
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-red-500 hover:text-red-600 ml-auto"
                  onClick={() => {
                    setDeleteId(selectedMessage.id);
                    setSelectedMessage(null);
                  }}
                  disabled={actionLoading === selectedMessage.id}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteId && deleteSubmission(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
