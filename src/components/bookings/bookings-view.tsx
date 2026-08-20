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
import { Plus, CalendarIcon, Check, X, ChevronRight, ChevronLeft, RefreshCw, Receipt, UserPlus, Banknote, AlertTriangle, ThumbsUp, ThumbsDown, Search } from 'lucide-react';
import PaymentReceipt, { ReceiptData } from '@/components/payments/payment-receipt';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Payment dialog (for existing bookings)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState('');
  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentReceiptNo, setPaymentReceiptNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Settings for rate calculation
  const [rates, setRates] = useState({
    morning: 500,
    day: 800,
    night: 800,
    reserved: 1100,
  });

  // Business name for receipts
  const [businessName, setBusinessName] = useState('Lamka Coaching Center');

  // Receipt dialog
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.settings) {
        setRates({
          morning: Number(json.settings.cabin_morning_shift_rate) || 500,
          day: Number(json.settings.cabin_day_shift_rate) || 800,
          night: Number(json.settings.cabin_night_shift_rate) || 800,
          reserved: Number(json.settings.cabin_reserved_rate) || 1100,
        });
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
    let rate = 0;
    if (booking.type === 'morning_shift') rate = rates.morning;
    if (booking.type === 'day_shift') rate = rates.day;
    if (booking.type === 'night_shift') rate = rates.night;
    if (booking.type === 'reserved') rate = rates.reserved;
    
    const typeLabel = booking.type.replace('_', ' ');
    if (!confirm(`Renew ${typeLabel} booking for ${booking.student.name} (Cabin #${booking.cabin.cabinNum}) by 1 month?\n\nAdditional cost: ${formatCurrency(rate * 100)}`)) return;
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
    const period = `${formatDate(booking.startDate)} - ${booking.endDate ? formatDate(booking.endDate) : 'Ongoing'}`;

    setReceiptData({
      receiptNo: payment.receivedAt.slice(0, 10).replace(/-/g, '').toUpperCase(),
      studentName: booking.student.name,
      studentPhone: booking.student.phone,
      paymentType: 'booking',
      cabinNum: booking.cabin.cabinNum,
      bookingType: booking.type,
      bookingPeriod: period,
      amount: payment.amount,
      mode: payment.mode,
      paidAt: payment.receivedAt,
      notes: booking.notes || undefined,
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
          paymentDate: paymentDate || undefined,
          receiptNo: paymentReceiptNo || undefined,
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



  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.student.name.toLowerCase().includes(q) ||
      b.student.phone.toLowerCase().includes(q) ||
      String(b.cabin.cabinNum).includes(q)
    );
  });

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
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="morning_shift">Morning Shift</SelectItem>
              <SelectItem value="day_shift">Day Shift</SelectItem>
              <SelectItem value="night_shift">Night Shift</SelectItem>
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search student or cabin..."
            className="pl-9 w-full sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Booking Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-gray-400">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No bookings found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((booking) => {
            const pending = booking.totalAmount - booking.paidAmount;
            return (
              <Card
                key={booking.id}
                className={cn(
                  'border shadow-sm hover:shadow-md transition-shadow',
                  booking.status === 'cancelled' && 'opacity-60',
                  booking.status === 'active' && pending === 0 && 'border-cyan-200',
                  booking.status === 'active' && pending > 0 && 'border-red-300 bg-red-50/10',
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
                          booking.type === 'reserved'
                            ? 'bg-sky-100 text-sky-800 border-sky-200'
                            : 'bg-indigo-100 text-indigo-800 border-indigo-200'
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
                      {pending > 0 && (
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                          Payment Due
                        </Badge>
                      )}
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
                    <p className="text-sm text-gray-500">
                      {formatDate(booking.startDate)}
                      {booking.endDate ? ` - ${formatDate(booking.endDate)}` : ' - Ongoing'}
                    </p>
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
                      {(['reserved', 'morning_shift', 'day_shift', 'night_shift'].includes(booking.type)) && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Receipt No <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. RCPT-001"
                  value={paymentReceiptNo}
                  onChange={(e) => setPaymentReceiptNo(e.target.value)}
                />
              </div>
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
