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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Eye,
  EyeOff,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FaqView() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      if (res.ok) {
        setFaqs(data.faqs || []);
      }
    } catch {
      toast.error('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(
    (f) =>
      !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setSortOrder(faqs.length);
    setActive(true);
    setDialogOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditing(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setSortOrder(faq.sortOrder);
    setActive(faq.active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!question.trim()) {
      toast.error('Question is required');
      return;
    }
    if (!answer.trim()) {
      toast.error('Answer is required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/faqs/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.trim(),
            answer: answer.trim(),
            sortOrder,
            active,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to update FAQ');
          return;
        }
        toast.success('FAQ updated');
      } else {
        const res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.trim(),
            answer: answer.trim(),
            sortOrder,
            active,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to create FAQ');
          return;
        }
        toast.success('FAQ created');
      }

      setDialogOpen(false);
      fetchFaqs();
    } catch {
      toast.error('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('FAQ deleted');
        fetchFaqs();
      } else {
        toast.error('Failed to delete FAQ');
      }
    } catch {
      toast.error('Failed to delete FAQ');
    }
  };

  const toggleActive = async (faq: FAQ) => {
    try {
      const res = await fetch(`/api/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !faq.active }),
      });
      if (res.ok) {
        toast.success(faq.active ? 'FAQ deactivated' : 'FAQ activated');
        fetchFaqs();
      }
    } catch {
      toast.error('Failed to update FAQ');
    }
  };

  const activeCount = faqs.filter((f) => f.active).length;
  const inactiveCount = faqs.filter((f) => !f.active).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total FAQs', value: faqs.length, color: 'text-gray-900 dark:text-gray-100' },
          { label: 'Active', value: activeCount, color: 'text-green-700 dark:text-green-400' },
          { label: 'Inactive', value: inactiveCount, color: 'text-red-700 dark:text-red-400' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm dark:bg-gray-900">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
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
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
          <Plus className="h-4 w-4" />
          New FAQ
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredFaqs.length === 0 && (
        <div className="text-center py-16">
          <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {search ? 'No matching FAQs' : 'No FAQs yet'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {search ? 'Try a different search term' : 'Create your first FAQ to display on the public website'}
          </p>
          {!search && (
            <Button onClick={openCreate} className="mt-4 gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4" />
              Create FAQ
            </Button>
          )}
        </div>
      )}

      {/* FAQ List */}
      {!loading && filteredFaqs.length > 0 && (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <Card
              key={faq.id}
              className={`border shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900 ${
                !faq.active ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{faq.question}</h3>
                      <Badge
                        variant="outline"
                        className={
                          faq.active
                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                        }
                      >
                        {faq.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" /> {faq.sortOrder}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive(faq)}
                      title={faq.active ? 'Deactivate' : 'Activate'}
                    >
                      {faq.active ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(faq)}
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(faq.id)}
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
            <DialogTitle>{editing ? 'Edit FAQ' : 'Create FAQ'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the FAQ question and answer.' : 'Add a new frequently asked question.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Question *</Label>
              <Input
                id="faq-question"
                placeholder="e.g. What courses do you offer?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-answer">Answer *</Label>
              <Textarea
                id="faq-answer"
                placeholder="Write the answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faq-sort">Sort Order</Label>
                <Input
                  id="faq-sort"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={active}
                    onCheckedChange={setActive}
                    id="faq-active"
                  />
                  <Label htmlFor="faq-active" className="text-sm cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !question.trim() || !answer.trim()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editing ? (
                  'Update FAQ'
                ) : (
                  'Create FAQ'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
