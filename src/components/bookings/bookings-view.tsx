'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Check, X, ChevronRight, ChevronLeft, RefreshCw, Receipt, UserPlus, Banknote, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import PaymentReceipt from '@/components/payments/payment-receipt';
import { toast } from 'sonner';
import { formatCurrency, formatDate, formatTime, calculateHours, calculateMonths, addMonths } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface BookingPayment {
  id: string;
  amount: number;
  mode: string;
  receivedAt: string;
}

interface Booking {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  student: { id: string; name: string; phone: string };
  cabin: { id: string; cabinNum: number; status: string };
  payments: BookingPayment[];
}

interface StudentOption {
  id: string;
  name: string;
  phone: string;
}

interface CabinOption {
  id: string;
  cabinNum: number;
  status: string;
}

type StepType = 'type' | 'student' | 'cabin' | 'details' | 'confirm';

const STEPS: { key: StepType; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'student', label: 'Student' },
  { key: 'cabin', label: 'Cabin' },
  { key: 'details', label: 'Details' },
  { key: 'confirm', label: 'Confirm' },
];

export default function BookingsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // New booking wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<StepType>('type');
  const [wizardType, setWizardType] = useState<'hourly' | 'exclusive'>('hourly');
  const [wizardStudentId, setWizardStudentId] = useState('');
  const [wizardStudentSearch, setWizardStudentSearch] = useState('');
  const [wizardCabinId, setWizardCabinId] = useState('');
  const [wizardDate, setWizardDate] = useState<Date>(new Date());
  const [wizardStartTime, setWizardStartTime] = useState('09:00');
  const [wizardEndTime, setWizardEndTime] = useState('12:00');
  const [wizardEndDate, setWizardEndDate] = useState<Date | undefined>(addMonths(new Date(), 1));
  const [wizardAmount, setWizardAmount] = useState('');
  const [wizardNotes, setWizardNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inline student creation in wizard
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Options for student & cabin selects
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [cabinOptions, setCabinOptions] = useState<CabinOption[]>([]);

  // Payment dialog (for existing bookings)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState('');
  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Inline payment during booking wizard (Step 5)
  const [wizardPayNow, setWizardPayNow] = useState(false);
  const [wizardPayAmount, setWizardPayAmount] = useState('');
  const [wizardPayMode, setWizardPayMode] = useState<'cash' | 'upi'>('cash');

  // Settings for rate calculation
  const [hourlyRate, setHourlyRate] = useState(100);
  const [monthlyRate, setMonthlyRate] = useState(3000);

  // Business name for receipts
  const [businessName, setBusinessName] = useState('Lamka Coaching Center');

  // Receipt dialog
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<null | {
    receiptNo: string;
    studentName: string;
    studentPhone: string;
    cabinNum: number;
    bookingType: string;
    bookingPeriod: string;
    amount: number;
    mode: string;
    paidAt: string;
    notes: string | null;
    businessName: string;
  }>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.settings) {
        setHourlyRate(Number(json.settings.hourly_rate) || 100);
        setMonthlyRate(Number(json.settings.monthly_rate) || 3000);
        setBusinessName(json.settings.business_name || 'Lamka Coaching Center');
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter.toISOString().split('T')[0]);
      const res = await fetch(`/api/bookings?${params.toString()}`);
      const json = await res.json();
      if (json.bookings) setBookings(json.bookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, dateFilter]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings?status=pending');
      const json = await res.json();
      setPendingCount(json.bookings?.length || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchBookings();
    fetchPendingCount();
  }, [fetchBookings, fetchPendingCount]);

  const fetchStudentOptions = useCallback(async (search: string) => {
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.students) setStudentOptions(json.students);
    } catch {
      // ignore
    }
  }, []);

  const fetchCabinOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/cabins');
      const json = await res.json();
      if (json.cabins) setCabinOptions(json.cabins);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (wizardOpen && step === 'student') {
      fetchStudentOptions(wizardStudentSearch);
    }
  }, [wizardOpen, step, wizardStudentSearch, fetchStudentOptions]);

  useEffect(() => {
    if (wizardOpen && step === 'cabin') {
      fetchCabinOptions();
    }
  }, [wizardOpen, step, fetchCabinOptions]);

  // Auto-calculate amount when details change
  useEffect(() => {
    if (step === 'details') {
      if (wizardType === 'hourly') {
        const hours = calculateHours(wizardStartTime, wizardEndTime);
        const amount = Math.round(hours * hourlyRate);
        setWizardAmount(String(amount));
      } else if (wizardType === 'exclusive' && wizardEndDate) {
        const months = calculateMonths(wizardDate, wizardEndDate);
        const amount = months * monthlyRate;
        setWizardAmount(String(amount));
      }
    }
  }, [step, wizardType, wizardStartTime, wizardEndTime, wizardDate, wizardEndDate, hourlyRate, monthlyRate]);

  // Auto-set end date to 1 month from start date when start date changes (exclusive bookings)
  useEffect(() => {
    if (wizardType === 'exclusive') {
      setWizardEndDate(addMonths(wizardDate, 1));
    }
  }, [wizardDate, wizardType]);

  const resetWizard = () => {
    setStep('type');
    setWizardType('hourly');
    setWizardStudentId('');
    setWizardStudentSearch('');
    setWizardCabinId('');
    setWizardDate(new Date());
    setWizardStartTime('09:00');
    setWizardEndTime('12:00');
    setWizardEndDate(addMonths(new Date(), 1));
    setWizardAmount('');
    setWizardNotes('');
    setShowNewStudentForm(false);
    setNewStudentName('');
    setNewStudentPhone('');
    setCreatingStudent(false);
    setWizardPayNow(false);
    setWizardPayAmount('');
    setWizardPayMode('cash');
  };

  const openWizard = () => {
    resetWizard();
    setWizardOpen(true);
  };

  const handleCreateBooking = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        action: 'create',
        studentId: wizardStudentId,
        cabinId: wizardCabinId,
        type: wizardType,
        totalAmount: Number(wizardAmount),
        notes: wizardNotes || undefined,
      };

      // Include payment info if Pay Now is enabled
      if (wizardPayNow && wizardPayAmount && Number(wizardPayAmount) > 0) {
        body.payNow = true;
        body.payAmount = Number(wizardPayAmount);
        body.payMode = wizardPayMode;
      }

      if (wizardType === 'hourly') {
        body.startDate = wizardDate.toISOString().split('T')[0];
        body.startTime = wizardStartTime;
        body.endTime = wizardEndTime;
      } else {
        body.startDate = wizardDate.toISOString().split('T')[0];
        if (wizardEndDate) body.endDate = wizardEndDate.toISOString().split('T')[0];
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Failed to create booking');
        return;
      }

      // Show success with payment info if applicable
      if (wizardPayNow && wizardPayAmount && Number(wizardPayAmount) > 0) {
        toast.success(`Booking created with payment of ${formatCurrency(Number(wizardPayAmount) * 100)} recorded!`);
      } else {
        toast.success('Booking created successfully!');
      }
      setWizardOpen(false);
      resetWizard();
      fetchBookings();
    } catch {
      toast.error('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveBooking = async (booking: Booking) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, action: 'approve' }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to approve booking');
        return;
      }
      toast.success('Booking approved successfully');
      fetchBookings();
      fetchPendingCount();
    } catch {
      toast.error('Failed to approve booking');
    }
  };

  const handleRejectBooking = async (booking: Booking) => {
    if (!confirm(`Reject this booking request for ${booking.student.name}?`)) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, action: 'reject' }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to reject booking');
        return;
      }
      toast.success('Booking rejected');
      fetchBookings();
      fetchPendingCount();
    } catch {
      toast.error('Failed to reject booking');
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm(`Cancel this booking for ${booking.student.name}?`)) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', id: booking.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to cancel booking');
        return;
      }
      toast.success('Booking cancelled');
      fetchBookings();
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const handleCompleteBooking = async (booking: Booking) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', id: booking.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to complete booking');
        return;
      }
      toast.success('Booking marked as completed');
      fetchBookings();
    } catch {
      toast.error('Failed to complete booking');
    }
  };

  const openPaymentDialog = (booking: Booking) => {
    setPaymentBookingId(booking.id);
    setPaymentStudentId(booking.student.id);
    setPaymentAmount('');
    setPaymentMode('cash');
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  };

  const handleRenewBooking = async (booking: Booking) => {
    if (!confirm(`Renew exclusive booking for ${booking.student.name} (Cabin #${booking.cabin.cabinNum}) by 1 month?\n\nAdditional cost: ${formatCurrency(monthlyRate * 100)}`)) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'renew', id: booking.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to renew booking');
        return;
      }
      toast.success(`Booking renewed! New end date: ${formatDate(json.newEndDate)}`);
      fetchBookings();
    } catch {
      toast.error('Failed to renew booking');
    }
  };

  const openReceipt = (booking: Booking, payment: { amount: number; mode: string; receivedAt: string }) => {
    const period = booking.type === 'hourly'
      ? `${formatDate(booking.startDate)}, ${formatTime(booking.startTime || '')} - ${formatTime(booking.endTime || '')}`
      : `${formatDate(booking.startDate)} - ${booking.endDate ? formatDate(booking.endDate) : 'Ongoing'}`;

    setReceiptData({
      receiptNo: payment.receivedAt.slice(0, 10).replace(/-/g, '').toUpperCase(),
      studentName: booking.student.name,
      studentPhone: booking.student.phone,
      cabinNum: booking.cabin.cabinNum,
      bookingType: booking.type,
      bookingPeriod: period,
      amount: payment.amount,
      mode: payment.mode,
      paidAt: payment.receivedAt,
      notes: booking.notes,
      businessName,
    });
    setReceiptOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setPaymentSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          bookingId: paymentBookingId,
          studentId: paymentStudentId,
          amount: Number(paymentAmount),
          mode: paymentMode,
          notes: paymentNotes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to record payment');
        return;
      }
      toast.success(`Payment of ${formatCurrency(Number(paymentAmount) * 100)} recorded!`);
      setPaymentDialogOpen(false);
      fetchBookings();
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleCreateInlineStudent = async () => {
    if (!newStudentName.trim() || !newStudentPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setCreatingStudent(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: newStudentName.trim(), phone: newStudentPhone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to create student');
        return;
      }
      const newStudent = json.student;
      toast.success(`Student "${newStudent.name}" created successfully!`);
      setWizardStudentId(newStudent.id);
      setStudentOptions((prev) => [...prev, { id: newStudent.id, name: newStudent.name, phone: newStudent.phone }]);
      setShowNewStudentForm(false);
      setNewStudentName('');
      setNewStudentPhone('');
    } catch {
      toast.error('Failed to create student');
    } finally {
      setCreatingStudent(false);
    }
  };

  const selectedStudent = studentOptions.find((s) => s.id === wizardStudentId);
  const selectedCabin = cabinOptions.find((c) => c.id === wizardCabinId);

  const availableCabins = cabinOptions.filter((c) => {
    if (c.status !== 'active') return false;
    return !bookings.some(
      (b) => b.cabinId === c.id && b.status === 'active' && b.type === 'exclusive'
    );
  });

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="space-y-4">
      {/* Pending Booking Requests Alert */}
      {pendingCount > 0 && statusFilter !== 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-800">
                {pendingCount} pending booking request{pendingCount !== 1 ? 's' : ''} awaiting review
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatusFilter('pending')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 self-start sm:self-auto"
            >
              Review Now
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="exclusive">Exclusive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? formatDate(dateFilter.toISOString()) : 'Filter by date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={(d) => {
                  setDateFilter(d);
                }}
              />
              {dateFilter && (
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateFilter(undefined)}>
                    Clear date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={openWizard} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Booking Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-gray-400">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No bookings found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new booking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking) => {
            const pending = booking.totalAmount - booking.paidAmount;
            return (
              <Card
                key={booking.id}
                className={cn(
                  'border shadow-sm hover:shadow-md transition-shadow',
                  booking.status === 'cancelled' && 'opacity-60',
                  booking.status === 'active' && 'border-cyan-200',
                  booking.status === 'pending' && 'border-amber-200'
                )}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          booking.type === 'exclusive'
                            ? 'bg-sky-100 text-sky-800 border-sky-200'
                            : 'bg-sky-100 text-sky-800 border-sky-200'
                        )}
                      >
                        {booking.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          booking.status === 'active' && 'bg-cyan-100 text-cyan-800 border-cyan-200',
                          booking.status === 'pending' && 'bg-amber-100 text-amber-800 border-amber-200',
                          booking.status === 'completed' && 'bg-gray-100 text-gray-600 border-gray-200',
                          booking.status === 'cancelled' && 'bg-red-100 text-red-800 border-red-200'
                        )}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{booking.student.name}</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      Cabin #{booking.cabin.cabinNum} &bull; {booking.student.phone}
                    </p>
                    {booking.type === 'hourly' ? (
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.startDate)} &bull;{' '}
                        {formatTime(booking.startTime || '')} - {formatTime(booking.endTime || '')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.startDate)}
                        {booking.endDate ? ` - ${formatDate(booking.endDate)}` : ' - Ongoing'}
                      </p>
                    )}
                    {booking.notes && (
                      <p className="text-xs text-gray-400 italic">{booking.notes}</p>
                    )}
                  </div>

                  {/* Payment info */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-cyan-600 font-medium">
                        Paid: {formatCurrency(booking.paidAmount)}
                      </span>
                      {pending > 0 && (
                        <span className="text-red-600 font-medium">
                          Due: {formatCurrency(pending)}
                        </span>
                      )}
                    </div>
                    {booking.payments.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {booking.payments.length} payment{booking.payments.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Pending Actions */}
                  {booking.status === 'pending' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveBooking(booking)}
                        className="text-xs h-9 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectBooking(booking)}
                        className="text-xs h-9 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  {booking.status === 'active' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pending > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPaymentDialog(booking)}
                          className="text-xs h-9 text-cyan-700 border-cyan-300 hover:bg-cyan-50"
                        >
                          Record Payment
                        </Button>
                      )}
                      {booking.type === 'exclusive' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRenewBooking(booking)}
                          className="text-xs h-9 text-sky-700 border-sky-300 hover:bg-sky-50"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Renew +1 Month
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteBooking(booking)}
                        className="text-xs h-9"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelBooking(booking)}
                        className="text-xs h-9 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                  {/* Payment history with receipt buttons */}
                  {booking.payments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Payments</p>
                      <div className="space-y-1">
                        {booking.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {formatDate(p.receivedAt)} &middot; <span className="uppercase">{p.mode}</span> &middot; {formatCurrency(p.amount)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReceipt(booking, p)}
                              className="h-8 px-3 text-xs text-gray-400 hover:text-cyan-600"
                            >
                              <Receipt className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { setWizardOpen(open); if (!open) resetWizard(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-4 px-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => {
                    if (i < stepIndex) setStep(s.key);
                  }}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium transition-colors',
                    i === stepIndex
                      ? 'bg-cyan-600 text-white'
                      : i < stepIndex
                      ? 'bg-cyan-100 text-cyan-700 cursor-pointer'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-6 sm:w-10 h-0.5 mx-1',
                      i < stepIndex ? 'bg-cyan-300' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">
            {step === 'type' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">Select the type of booking</p>
                <button
                  onClick={() => setWizardType('hourly')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    wizardType === 'hourly'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className="font-semibold text-gray-900">Hourly Booking</p>
                  <p className="text-sm text-gray-500 mt-1">Book a cabin for a specific time slot</p>
                </button>
                <button
                  onClick={() => setWizardType('exclusive')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    wizardType === 'exclusive'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className="font-semibold text-gray-900">Exclusive Reservation</p>
                  <p className="text-sm text-gray-500 mt-1">Reserve a cabin exclusively for a period</p>
                </button>
              </div>
            )}

            {step === 'student' && !showNewStudentForm && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-2">Select or search for a student</p>
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={wizardStudentSearch}
                  onChange={(e) => setWizardStudentSearch(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
                  onClick={() => {
                    setNewStudentName('');
                    setNewStudentPhone('');
                    setShowNewStudentForm(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New Student
                </Button>
                <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {studentOptions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">No students found</p>
                      <p className="text-xs text-gray-300 mt-1">Create a new student to get started</p>
                    </div>
                  ) : (
                    studentOptions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setWizardStudentId(s.id)}
                        className={cn(
                          'w-full p-3 rounded-lg text-left transition-colors',
                          wizardStudentId === s.id
                            ? 'bg-cyan-50 border border-cyan-200'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.phone}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {step === 'student' && showNewStudentForm && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Add a new student</p>
                <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-student-name">Full Name</Label>
                    <Input
                      id="new-student-name"
                      placeholder="Enter student name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-student-phone">Phone Number</Label>
                    <Input
                      id="new-student-phone"
                      placeholder="Enter phone number"
                      value={newStudentPhone}
                      onChange={(e) => setNewStudentPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={handleCreateInlineStudent}
                      disabled={creatingStudent || !newStudentName.trim() || !newStudentPhone.trim()}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      {creatingStudent ? 'Creating...' : 'Create & Select'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewStudentForm(false)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 'cabin' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-2">Select an available cabin</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                  {availableCabins.length === 0 ? (
                    <p className="col-span-full text-sm text-gray-400 text-center py-4">
                      No available cabins
                    </p>
                  ) : (
                    availableCabins.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setWizardCabinId(c.id)}
                        className={cn(
                          'p-3 rounded-xl border-2 text-center transition-all',
                          wizardCabinId === c.id
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <p className="font-bold text-gray-900">#{c.cabinNum}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Enter booking details</p>
                {wizardType === 'hourly' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDate(wizardDate.toISOString())}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={wizardDate}
                            onSelect={(d) => d && setWizardDate(d)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={wizardStartTime}
                          onChange={(e) => setWizardStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={wizardEndTime}
                          onChange={(e) => setWizardEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Duration: {calculateHours(wizardStartTime, wizardEndTime)} hour(s) &times; ₹{hourlyRate}/hr
                    </p>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formatDate(wizardDate.toISOString())}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={wizardDate}
                              onSelect={(d) => d && setWizardDate(d)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>End Date <span className="text-xs font-normal text-gray-400">(auto: 1 month from start)</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {wizardEndDate ? formatDate(wizardEndDate.toISOString()) : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={wizardEndDate}
                              onSelect={(d) => setWizardEndDate(d)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {wizardEndDate && (
                      <p className="text-sm text-gray-500">
                        Duration: {calculateMonths(wizardDate, wizardEndDate)} month(s) &times; ₹{monthlyRate}/month
                      </p>
                    )}
                  </>
                )}
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={wizardAmount}
                    onChange={(e) => setWizardAmount(e.target.value)}
                    min={0}
                  />
                  <p className="text-xs text-gray-400">Auto-calculated, you can adjust manually</p>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={wizardNotes}
                    onChange={(e) => setWizardNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Review and confirm your booking</p>
                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Type</span>
                    <Badge
                      variant="outline"
                      className={
                        wizardType === 'exclusive'
                          ? 'bg-sky-100 text-sky-800 border-sky-200'
                          : 'bg-sky-100 text-sky-800 border-sky-200'
                      }
                    >
                      {wizardType}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Student</span>
                    <span className="text-sm font-medium">{selectedStudent?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Cabin</span>
                    <span className="text-sm font-medium">#{selectedCabin?.cabinNum}</span>
                  </div>
                  {wizardType === 'hourly' ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Time</span>
                      <span className="text-sm font-medium">
                        {formatDate(wizardDate.toISOString())} &bull;{' '}
                        {formatTime(wizardStartTime)} - {formatTime(wizardEndTime)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Period</span>
                      <span className="text-sm font-medium">
                        {formatDate(wizardDate.toISOString())} -{' '}
                        {wizardEndDate ? formatDate(wizardEndDate.toISOString()) : 'N/A'}
                      </span>
                    </div>
                  )}
                  {wizardNotes && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Notes</span>
                      <span className="text-sm text-gray-600">{wizardNotes}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                    <span className="text-lg font-bold text-cyan-600">
                      {formatCurrency(Number(wizardAmount) * 100)}
                    </span>
                  </div>
                </div>

                {/* Pay Now Section */}
                <div className="rounded-xl border-2 border-dashed border-cyan-200 bg-cyan-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-cyan-600" />
                      <span className="text-sm font-semibold text-gray-800">Payment at Admission</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWizardPayNow(!wizardPayNow);
                        if (wizardPayNow) {
                          setWizardPayAmount('');
                          setWizardPayMode('cash');
                        }
                      }}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        wizardPayNow ? 'bg-cyan-600' : 'bg-gray-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                          wizardPayNow ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {wizardPayNow && (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-gray-500">Record the amount paid by the student at the time of admission.</p>
                      <div className="space-y-2">
                        <Label>Amount Paid (₹)</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount paid"
                          value={wizardPayAmount}
                          onChange={(e) => setWizardPayAmount(e.target.value)}
                          min={0}
                          max={Number(wizardAmount)}
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            Total: {formatCurrency(Number(wizardAmount) * 100)}
                          </span>
                          {wizardPayAmount && Number(wizardPayAmount) > 0 && (
                            <span className={cn(
                              'font-medium',
                              Number(wizardPayAmount) >= Number(wizardAmount)
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            )}>
                              {Number(wizardPayAmount) >= Number(wizardAmount)
                                ? 'Fully paid'
                                : `Due: ${formatCurrency((Number(wizardAmount) - Number(wizardPayAmount)) * 100)}`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Mode</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setWizardPayMode('cash')}
                            className={cn(
                              'flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                              wizardPayMode === 'cash'
                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            )}
                          >
                            <Banknote className="h-4 w-4" />
                            Cash
                          </button>
                          <button
                            type="button"
                            onClick={() => setWizardPayMode('upi')}
                            className={cn(
                              'flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                              wizardPayMode === 'upi'
                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            )}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                              <path d="M12 10v4" />
                              <path d="M10 12h4" />
                            </svg>
                            UPI
                          </button>
                        </div>
                      </div>
                      {wizardPayAmount && Number(wizardPayAmount) > 0 && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-cyan-200">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold text-emerald-700">{formatCurrency(Number(wizardPayAmount) * 100)}</span> will be recorded as <span className="uppercase font-medium">{wizardPayMode}</span> payment upon booking creation.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!wizardPayNow && (
                    <p className="text-xs text-gray-400">Toggle on to record payment received from the student at admission.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={() => setStep(STEPS[stepIndex - 1].key)} className="sm:mr-auto">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={() => setWizardOpen(false)}>
                Cancel
              </Button>
              {step !== 'confirm' ? (
                <Button
                  onClick={() => {
                    const canProceed =
                      (step === 'type') ||
                      (step === 'student' && wizardStudentId) ||
                      (step === 'cabin' && wizardCabinId) ||
                      (step === 'details' && wizardAmount && Number(wizardAmount) > 0);

                    if (!canProceed) {
                      if (step === 'student') toast.error('Please select a student');
                      else if (step === 'cabin') toast.error('Please select a cabin');
                      else if (step === 'details') toast.error('Please enter a valid amount');
                      return;
                    }
                    setStep(STEPS[stepIndex + 1].key);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateBooking}
                  disabled={submitting}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {submitting
                    ? 'Creating...'
                    : wizardPayNow && wizardPayAmount && Number(wizardPayAmount) > 0
                      ? `Book & Pay ${formatCurrency(Number(wizardPayAmount) * 100)}`
                      : 'Create Booking'
                  }
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Receipt Dialog */}
      <PaymentReceipt
        open={receiptOpen}
        onClose={() => { setReceiptOpen(false); setReceiptData(null); }}
        data={receiptData}
      />

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as 'cash' | 'upi')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Payment notes..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={paymentSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {paymentSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
