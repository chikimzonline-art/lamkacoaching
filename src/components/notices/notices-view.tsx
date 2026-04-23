'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Megaphone,
  Plus,
  Pin,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/helpers';

interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function NoticesView() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState('published');

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      if (res.ok) {
        setNotices(data.notices || []);
      }
    } catch {
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(
    (n) =>
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setPinned(false);
    setStatus('published');
    setDialogOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditing(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setPinned(notice.pinned);
    setStatus(notice.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setSaving(true);
    try {
      const body = editing
        ? { action: 'update', id: editing.id, title: title.trim(), content: content.trim(), pinned, status }
        : { action: 'create', title: title.trim(), content: content.trim(), pinned, status };

      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save notice');
        return;
      }

      toast.success(editing ? 'Notice updated' : 'Notice created');
      setDialogOpen(false);
      fetchNotices();
    } catch {
      toast.error('Failed to save notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (res.ok) {
        toast.success('Notice deleted');
        fetchNotices();
      }
    } catch {
      toast.error('Failed to delete notice');
    }
  };

  const toggleStatus = async (notice: Notice) => {
    const newStatus = notice.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: notice.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Notice ${newStatus === 'published' ? 'published' : 'unpublished'}`);
        fetchNotices();
      }
    } catch {
      toast.error('Failed to update notice');
    }
  };

  const togglePin = async (notice: Notice) => {
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: notice.id, pinned: !notice.pinned }),
      });
      if (res.ok) {
        toast.success(notice.pinned ? 'Unpinned' : 'Pinned');
        fetchNotices();
      }
    } catch {
      toast.error('Failed to update notice');
    }
  };

  const publishedCount = notices.filter((n) => n.status === 'published').length;
  const draftCount = notices.filter((n) => n.status === 'draft').length;
  const pinnedCount = notices.filter((n) => n.pinned).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Notices', value: notices.length, color: 'text-gray-900' },
          { label: 'Published', value: publishedCount, color: 'text-green-700' },
          { label: 'Drafts', value: draftCount, color: 'text-amber-700' },
          { label: 'Pinned', value: pinnedCount, color: 'text-orange-700' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="h-4 w-4" />
          New Notice
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      )}

      {/* Notices List */}
      {!loading && filteredNotices.length === 0 && (
        <div className="text-center py-16">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">
            {search ? 'No matching notices' : 'No notices yet'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {search ? 'Try a different search term' : 'Create your first notice to display on the public website'}
          </p>
          {!search && (
            <Button onClick={openCreate} className="mt-4 gap-2 bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4" />
              Create Notice
            </Button>
          )}
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {filteredNotices.map((notice) => (
            <Card
              key={notice.id}
              className={`border shadow-sm hover:shadow-md transition-shadow ${
                notice.pinned ? 'border-l-4 border-l-orange-500' : ''
              } ${notice.status === 'draft' ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{notice.title}</h3>
                      {notice.pinned && (
                        <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5">
                          <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          notice.status === 'published'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }
                      >
                        {notice.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{notice.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created {formatDateTime(notice.createdAt)}
                      {notice.updatedAt !== notice.createdAt && ` · Updated ${formatDateTime(notice.updatedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => togglePin(notice)}
                      title={notice.pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`h-4 w-4 ${notice.pinned ? 'text-orange-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleStatus(notice)}
                      title={notice.status === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {notice.status === 'published' ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(notice)}
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(notice.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notice-title">Title *</Label>
              <Input
                id="notice-title"
                placeholder="Notice title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-content">Content *</Label>
              <Textarea
                id="notice-content"
                placeholder="Write the notice content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={pinned}
                  onCheckedChange={setPinned}
                  id="notice-pinned"
                />
                <Label htmlFor="notice-pinned" className="text-sm cursor-pointer">
                  Pin to top
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={status === 'published'}
                  onCheckedChange={(checked) => setStatus(checked ? 'published' : 'draft')}
                  id="notice-status"
                />
                <Label htmlFor="notice-status" className="text-sm cursor-pointer">
                  Publish immediately
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editing ? (
                  'Update Notice'
                ) : (
                  'Create Notice'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
