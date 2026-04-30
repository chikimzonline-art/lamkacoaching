'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Users,
  Loader2,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import QuickPayDialog from './QuickPayDialog';

interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  totalDue: number;
  totalPaid: number;
  totalAmount: number;
  activeBookingCount: number;
  activeEnrollmentCount: number;
}

interface StudentFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: StudentFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

function formatCurrency(amount: number): string {
  return `₹${(amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function StudentsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [quickPayStudent, setQuickPayStudent] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('bookings', 'true');
      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const openAddDialog = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setForm({
      name: student.name,
      phone: student.phone,
      email: student.email || '',
      address: student.address || '',
      notes: student.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        action: editingStudent ? 'update' : 'create',
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingStudent) {
        body.id = editingStudent.id;
      }

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save student');
      }

      toast.success(
        editingStudent ? 'Student updated successfully' : 'Student added successfully'
      );
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }
      toast.success('Student deleted');
      fetchStudents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  const openQuickPay = (student: Student) => {
    setQuickPayStudent({ id: student.id, name: student.name, phone: student.phone });
    setQuickPayOpen(true);
  };

  // Summary stats
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.activeBookingCount > 0 || (s.activeEnrollmentCount ?? 0) > 0).length;
  const withPendingFees = students.filter((s) => s.totalDue > 0).length;
  const totalPending = students.reduce((sum, s) => sum + s.totalDue, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-cyan-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Students</h2>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="border-cyan-100">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500">Total Students</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
              ) : (
                totalStudents
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-cyan-100">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500">Active Students</p>
            <p className="text-lg sm:text-2xl font-bold text-cyan-600">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
              ) : (
                activeStudents
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-sky-100">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500">With Pending Fees</p>
            <p className="text-lg sm:text-2xl font-bold text-sky-600">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              ) : (
                withPendingFees
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-sky-100">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-500">Total Pending</p>
            <p className="text-lg sm:text-2xl font-bold text-sky-700">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              ) : (
                formatCurrency(totalPending)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && students.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No students found</p>
          <p className="text-sm">Add your first student to get started</p>
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && students.length > 0 && (
        <div className="md:hidden space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {students.map((student) => (
            <Card key={student.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{student.phone}</span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span>{student.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-cyan-600"
                      onClick={() => openEditDialog(student)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => handleDelete(student.id)}
                      disabled={deletingId === student.id}
                    >
                      {deletingId === student.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge
                    variant="secondary"
                    className={
                      student.activeBookingCount > 0
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-gray-100 text-gray-500'
                    }
                  >
                    {student.activeBookingCount} Booking{student.activeBookingCount !== 1 ? 's' : ''}
                  </Badge>
                  {(student.activeEnrollmentCount ?? 0) > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {student.activeEnrollmentCount} Course{(student.activeEnrollmentCount ?? 0) !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {student.totalDue > 0 && (
                    <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                      Due: {formatCurrency(student.totalDue)}
                    </Badge>
                  )}
                </div>

                {student.totalDue > 0 && (
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                    onClick={() => openQuickPay(student)}
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    Quick Pay
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop Table Layout */}
      {!loading && students.length > 0 && (
        <div className="hidden md:block rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-cyan-50/50">
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {student.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.email ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {student.email}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        student.activeBookingCount > 0
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-gray-100 text-gray-500'
                      }
                    >
                      {student.activeBookingCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        (student.activeEnrollmentCount ?? 0) > 0
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-500'
                      }
                    >
                      {student.activeEnrollmentCount ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(student.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(student.totalPaid)}
                  </TableCell>
                  <TableCell className="text-right">
                    {student.totalDue > 0 ? (
                      <span className="font-semibold text-sky-600">
                        {formatCurrency(student.totalDue)}
                      </span>
                    ) : (
                      <span className="text-gray-300">₹0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {student.totalDue > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                          onClick={() => openQuickPay(student)}
                        >
                          <Banknote className="h-3.5 w-3.5 mr-1" />
                          Pay
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-cyan-600"
                        onClick={() => openEditDialog(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                        onClick={() => handleDelete(student.id)}
                        disabled={deletingId === student.id}
                      >
                        {deletingId === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-500" />
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? 'Update student information'
                : 'Enter details for the new student'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Name *</Label>
                <Input
                  id="student-name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-phone">Phone *</Label>
                <Input
                  id="student-phone"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="Email address (optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-address">Address</Label>
              <Input
                id="student-address"
                placeholder="Address (optional)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-notes">Notes</Label>
              <Textarea
                id="student-notes"
                placeholder="Additional notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : editingStudent ? (
                'Update Student'
              ) : (
                'Add Student'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Pay Dialog */}
      <QuickPayDialog
        open={quickPayOpen}
        onOpenChange={setQuickPayOpen}
        student={quickPayStudent}
        onSuccess={fetchStudents}
      />
    </div>
  );
}
