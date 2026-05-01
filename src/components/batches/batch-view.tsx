'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Clock,
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  IndianRupee,
  Hourglass,
} from 'lucide-react';
import { toast } from 'sonner';

interface Batch {
  id: string;
  courseName: string;
  department: string;
  startDate: string;
  duration: string;
  timing: string;
  seats: number;
  status: string;
  fee: number;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BatchFormData {
  courseName: string;
  department: string;
  startDate: string;
  duration: string;
  timing: string;
  seats: number;
  status: string;
  fee: number;
  description: string;
  sortOrder: number;
}

const emptyForm: BatchFormData = {
  courseName: '',
  department: 'Computer Training',
  startDate: '',
  duration: '',
  timing: '',
  seats: 10,
  status: 'enrolling',
  fee: 0,
  description: '',
  sortOrder: 0,
};

const statusOptions = [
  { value: 'enrolling', label: 'Enrolling' },
  { value: 'almost_full', label: 'Almost Full' },
  { value: 'full', label: 'Full' },
  { value: 'closed', label: 'Closed' },
];

const statusColors: Record<string, string> = {
  enrolling: 'bg-green-100 text-green-700',
  almost_full: 'bg-orange-100 text-orange-700',
  full: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export default function BatchView() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BatchFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/batches');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBatches(data);
    } catch {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseName || !form.startDate || !form.duration || !form.timing) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create batch');
      }
      toast.success('Batch created successfully');
      setForm(emptyForm);
      fetchBatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/batches/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update batch');
      }
      toast.success('Batch updated successfully');
      setEditingId(null);
      setEditDialogOpen(false);
      fetchBatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/batches/${deletingId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete batch');
      }
      toast.success('Batch deleted successfully');
      setDeletingId(null);
      setDeleteDialogOpen(false);
      fetchBatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };

  const openEditDialog = (batch: Batch) => {
    setEditingId(batch.id);
    setForm({
      courseName: batch.courseName,
      department: batch.department,
      startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
      duration: batch.duration,
      timing: batch.timing,
      seats: batch.seats,
      status: batch.status,
      fee: batch.fee,
      description: batch.description || '',
      sortOrder: batch.sortOrder,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const BatchForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="courseName">Course Name *</Label>
          <Input
            id="courseName"
            value={form.courseName}
            onChange={(e) => setForm({ ...form, courseName: e.target.value })}
            placeholder="e.g., SSC CGL 2025 Batch"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Competitive Exams">Competitive Exams</SelectItem>
              <SelectItem value="Computer Training">Computer Training</SelectItem>
              <SelectItem value="Banking Exams">Banking Exams</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration *</Label>
          <Input
            id="duration"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="e.g., 6 Months"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timing">Timing *</Label>
          <Input
            id="timing"
            value={form.timing}
            onChange={(e) => setForm({ ...form, timing: e.target.value })}
            placeholder="e.g., Morning: 7:00 AM – 10:00 AM"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats">Seats</Label>
          <Input
            id="seats"
            type="number"
            min={0}
            value={form.seats}
            onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">Fee (₹)</Label>
          <Input
            id="fee"
            type="number"
            min={0}
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Batches</TabsTrigger>
          <TabsTrigger value="add">Add Batch</TabsTrigger>
        </TabsList>

        {/* All Batches Tab */}
        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No batches found. Add your first batch!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {batches.map((batch) => (
                <Card key={batch.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{batch.courseName}</h3>
                        <p className="text-sm text-gray-500">{batch.department}</p>
                      </div>
                      <Badge className={`text-[10px] shrink-0 ${statusColors[batch.status] || 'bg-gray-100 text-gray-700'}`}>
                        {batch.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(batch.startDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {batch.timing}
                      </div>
                      <div className="flex items-center gap-2">
                        <Hourglass className="h-3.5 w-3.5 text-gray-400" />
                        {batch.duration}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {batch.seats} seats
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                          {formatCurrency(batch.fee)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(batch)}
                        className="h-8 text-xs gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(batch.id)}
                        className="h-8 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add Batch Tab */}
        <TabsContent value="add" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-cyan-600" />
                Create New Batch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BatchForm onSubmit={handleCreate} submitLabel="Create Batch" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingId(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          <BatchForm onSubmit={handleEdit} submitLabel="Update Batch" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete this batch? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
