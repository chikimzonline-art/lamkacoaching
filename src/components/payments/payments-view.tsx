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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Banknote,
  Search,
  TrendingUp,
  AlertCircle,
  Trash2,
  Receipt,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import PaymentReceipt from './payment-receipt';

interface Payment {
  id: string;
  type: 'booking' | 'enrollment';
  studentId: string;
  amount: number;
  mode: string;
  status: string;
  receivedAt: string;
  notes?: string | null;
  student: {
    id: string;
    name: string;
    phone: string;
  };
  booking?: {
    id: string;
    type: string;
    totalAmount: number;
    cabin: {
      cabinNum: number;
    };
  };
  enrollment?: {
    id: string;
    course: { name: string; department: { name: string } };
  };
}

interface ReceiptData {
  receiptNo: string;
  studentName: string;
  studentPhone: string;
  // Booking-specific
  cabinNum?: number;
  bookingType?: string;
  bookingPeriod?: string;
  // Enrollment-specific
  courseName?: string;
  departmentName?: string;
  enrollmentPeriod?: string;
  // Common
  paymentType: 'booking' | 'enrollment';
  amount: number;
  mode: string;
  paidAt: string;
  notes?: string;
  businessName: string;
}

interface Student {
  id: string;
  name: string;
  phone: string;
}

interface StudentBooking {
  id: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  cabin: { cabinNum: number };
}

function formatCurrency(amount: number): string {
  return `₹${(amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stats
  const [todayCollected, setTodayCollected] = useState(0);
  const [monthCollected, setMonthCollected] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // Business name
  const [businessName, setBusinessName] = useState('Lamka Coaching Center');

  // Receipt dialog
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Record payment dialog
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentBookings, setStudentBookings] = useState<StudentBooking[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [fetchingBookings, setFetchingBookings] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
        calculateStats(data.payments);
      }
    } catch {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (paymentList: Payment[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTotal = paymentList
      .filter((p) => new Date(p.receivedAt) >= today)
      .reduce((sum, p) => sum + p.amount, 0);

    const monthTotal = paymentList
      .filter((p) => new Date(p.receivedAt) >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0);

    setTodayCollected(todayTotal);
    setMonthCollected(monthTotal);
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.stats) {
        setTotalPending(data.stats.totalPending + (data.stats.enrollmentOutstanding || 0));
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings?.business_name) {
        setBusinessName(data.settings.business_name);
      }
    } catch {
      // use default
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchDashboardStats();
    fetchSettings();
  }, [fetchPayments, fetchDashboardStats, fetchSettings]);

  const fetchStudentsList = async () => {
    setFetchingStudents(true);
    try {
      const res = await fetch('/api/students?bookings=false');
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setFetchingStudents(false);
    }
  };

  const fetchStudentBookings = async (studentId: string) => {
    setFetchingBookings(true);
    setStudentBookings([]);
    setSelectedBookingId('');
    try {
      const res = await fetch(
        `/api/bookings?studentId=${studentId}&status=active`
      );
      const data = await res.json();
      if (data.bookings) {
        const pending = data.bookings.filter(
          (b: StudentBooking) => b.totalAmount - b.paidAmount > 0
        );
        setStudentBookings(pending);
        if (pending.length === 1) {
          setSelectedBookingId(pending[0].id);
        }
      }
    } catch {
      toast.error('Failed to fetch bookings');
    } finally {
      setFetchingBookings(false);
    }
  };

  useEffect(() => {
    if (selectedBookingId) {
      const booking = studentBookings.find((b) => b.id === selectedBookingId);
      if (booking) {
        const pending = booking.totalAmount - booking.paidAmount;
        setPayAmount((pending / 100).toString());
      }
    }
  }, [selectedBookingId, studentBookings]);

  const openRecordDialog = () => {
    setSelectedStudentId('');
    setSelectedBookingId('');
    setPayAmount('');
    setPayMode('cash');
    setPayNotes('');
    setStudentBookings([]);
    setRecordDialogOpen(true);
    fetchStudentsList();
  };

  const handleRecordPayment = async () => {
    if (!selectedStudentId || !selectedBookingId || !payAmount || !payMode) {
      toast.error('Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          bookingId: selectedBookingId,
          studentId: selectedStudentId,
          amount: numAmount,
          mode: payMode,
          notes: payNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      toast.success('Payment recorded successfully!');
      setRecordDialogOpen(false);
      fetchPayments();
      fetchDashboardStats();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to record payment'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete payment');
      }
      toast.success('Payment deleted');
      fetchPayments();
      fetchDashboardStats();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete payment'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const viewReceipt = (payment: Payment) => {
    if (payment.type === 'booking' && payment.booking) {
      const booking = payment.booking;
      const period =
        booking.type === 'hourly'
          ? formatDate(payment.receivedAt)
          : formatDate(payment.receivedAt);

      setReceiptData({
        receiptNo: payment.id.slice(-8).toUpperCase(),
        studentName: payment.student.name,
        studentPhone: payment.student.phone,
        paymentType: 'booking',
        cabinNum: booking.cabin.cabinNum,
        bookingType: booking.type,
        bookingPeriod: period,
        amount: payment.amount,
        mode: payment.mode,
        paidAt: payment.receivedAt,
        notes: payment.notes || undefined,
        businessName,
      });
    } else if (payment.enrollment) {
      setReceiptData({
        receiptNo: payment.id.slice(-8).toUpperCase(),
        studentName: payment.student.name,
        studentPhone: payment.student.phone,
        paymentType: 'enrollment',
        courseName: payment.enrollment.course.name,
        departmentName: payment.enrollment.course.department.name,
        amount: payment.amount,
        mode: payment.mode,
        paidAt: payment.receivedAt,
        notes: payment.notes || undefined,
        businessName,
      });
    }
    setReceiptOpen(true);
  };

  // Filter payments by search
  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const label = p.type === 'booking' && p.booking
      ? `Cabin ${p.booking.cabin.cabinNum}`
      : p.enrollment
        ? p.enrollment.course.name
        : '';
    return (
      p.student.name.toLowerCase().includes(q) ||
      p.student.phone.includes(q) ||
      label.toLowerCase().includes(q) ||
      p.mode.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  });

  const selectedBooking = studentBookings.find(
    (b) => b.id === selectedBookingId
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-6 w-6 text-orange-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Payments
          </h2>
        </div>
        <Button
          onClick={openRecordDialog}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-orange-100">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2.5">
              <Banknote className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Collected Today</p>
              <p className="text-lg sm:text-xl font-bold text-orange-600">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                ) : (
                  formatCurrency(todayCollected)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2.5">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">This Month</p>
              <p className="text-lg sm:text-xl font-bold text-amber-600">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                ) : (
                  formatCurrency(monthCollected)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2.5">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total Pending</p>
              <p className="text-lg sm:text-xl font-bold text-red-600">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                ) : (
                  formatCurrency(totalPending)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, phone, cabin, or mode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* Empty */}
      {!loading && filteredPayments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Banknote className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No payments found</p>
          <p className="text-sm">
            {search
              ? 'Try adjusting your search'
              : 'Record your first payment to get started'}
          </p>
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && filteredPayments.length > 0 && (
        <div className="md:hidden space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {payment.student.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {payment.student.phone}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {payment.type === 'booking' && payment.booking ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Cabin {payment.booking.cabin.cabinNum}
                    </Badge>
                  ) : payment.enrollment ? (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {payment.enrollment.course.name}
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className={payment.type === 'booking' ? 'capitalize bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'}>
                    {payment.type === 'booking' ? payment.booking?.type || 'Booking' : 'Course'}
                  </Badge>
                  <Badge variant="secondary" className="uppercase bg-gray-100 text-gray-600">
                    {payment.mode}
                  </Badge>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  {formatDateTime(payment.receivedAt)}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => viewReceipt(payment)}
                  >
                    <Receipt className="h-3.5 w-3.5 mr-1" />
                    Receipt
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-600"
                    onClick={() => handleDelete(payment.id)}
                    disabled={deletingId === payment.id}
                  >
                    {deletingId === payment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop Table Layout */}
      {!loading && filteredPayments.length > 0 && (
        <div className="hidden md:block rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-50/50">
                <TableHead>Student</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Cabin</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.student.name}
                  </TableCell>
                  <TableCell>{payment.student.phone}</TableCell>
                  <TableCell className="text-center">
                    {payment.type === 'booking' && payment.booking ? (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700"
                      >
                        Cabin {payment.booking.cabin.cabinNum}
                      </Badge>
                    ) : payment.enrollment ? (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700"
                      >
                        {payment.enrollment.course.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {payment.type === 'booking' && payment.booking ? (
                      <Badge
                        variant="secondary"
                        className="capitalize bg-amber-50 text-amber-700"
                      >
                        {payment.booking.type}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-purple-50 text-purple-700"
                      >
                        Course
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-orange-600">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="uppercase text-sm">{payment.mode}</span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDateTime(payment.receivedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        onClick={() => viewReceipt(payment)}
                      >
                        <Receipt className="h-3.5 w-3.5 mr-1" />
                        Receipt
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                        onClick={() => handleDelete(payment.id)}
                        disabled={deletingId === payment.id}
                      >
                        {deletingId === payment.id ? (
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

      {/* Record Payment Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Record Payment
            </DialogTitle>
            <DialogDescription>Record a new payment for a student</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student Select */}
            <div className="space-y-2">
              <Label>Student *</Label>
              {fetchingStudents ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading students...
                </div>
              ) : (
                <Select
                  value={selectedStudentId}
                  onValueChange={(v) => {
                    setSelectedStudentId(v);
                    setSelectedBookingId('');
                    setPayAmount('');
                    fetchStudentBookings(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Booking Select */}
            {selectedStudentId && (
              <div className="space-y-2">
                <Label>Booking *</Label>
                {fetchingBookings ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading bookings...
                  </div>
                ) : studentBookings.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">
                    No active bookings with pending amount
                  </p>
                ) : (
                  <Select
                    value={selectedBookingId}
                    onValueChange={setSelectedBookingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentBookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          Cabin {booking.cabin.cabinNum} •{' '}
                          <span className="capitalize">{booking.type}</span> •
                          Pending:{' '}
                          {formatCurrency(booking.totalAmount - booking.paidAmount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {selectedBooking && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Amount:</span>
                  <span className="font-semibold text-orange-700">
                    {formatCurrency(selectedBooking.totalAmount - selectedBooking.paidAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="record-amount">Amount (₹) *</Label>
              <Input
                id="record-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <Label>Payment Mode *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={payMode === 'cash' ? 'default' : 'outline'}
                  className={
                    payMode === 'cash'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : ''
                  }
                  onClick={() => setPayMode('cash')}
                >
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={payMode === 'upi' ? 'default' : 'outline'}
                  className={
                    payMode === 'upi'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : ''
                  }
                  onClick={() => setPayMode('upi')}
                >
                  UPI
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="record-notes">Notes</Label>
              <Textarea
                id="record-notes"
                placeholder="Optional notes..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRecordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={saving || !selectedStudentId || !selectedBookingId || !payAmount}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <PaymentReceipt
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
      />
    </div>
  );
}
