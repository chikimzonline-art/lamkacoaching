'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  CalendarIcon,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Receipt,
  CreditCard,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Search,
  LayoutList,
  LayoutGrid,
  Building,
  Users,
  Clock,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import PaymentReceipt, { ReceiptData } from '@/components/payments/payment-receipt';
import { BookingManagementDialog, Booking, BookingPayment, CabinOption } from './booking-management-dialog';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export default function BookingsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cabins, setCabins] = useState<CabinOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Master-Detail Management Dialog
  const [selectedBookingForManage, setSelectedBookingForManage] = useState<Booking | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

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

  const fetchCabins = useCallback(async () => {
    try {
      const res = await fetch('/api/cabins');
      const json = await res.json();
      if (json.cabins) {
        setCabins(
          json.cabins.map((c: any) => ({
            id: c.id,
            cabinNum: c.cabinNum,
            floor: c.floor,
            status: c.status,
          }))
        );
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
      if (json.bookings) {
        setBookings(json.bookings);
        // If a booking is currently opened in manage dialog, update its live reference
        if (selectedBookingForManage) {
          const updated = json.bookings.find((b: Booking) => b.id === selectedBookingForManage.id);
          if (updated) setSelectedBookingForManage(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, dateFilter, selectedBookingForManage]);

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
    fetchCabins();
  }, [fetchSettings, fetchCabins]);

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
    const pendingPaise = Math.max(0, booking.totalAmount - booking.paidAmount);
    setPaymentAmount(String(pendingPaise / 100));
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
    if (
      !confirm(
        `Renew ${typeLabel} booking for ${booking.student.name} (Cabin #${booking.cabin.cabinNum}) by 1 month?\n\nAdditional cost: ${formatCurrency(
          rate * 100
        )}`
      )
    )
      return;
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

  const openReceipt = (
    booking: Booking,
    payment: { amount: number; mode: string; receivedAt: string; receiptNo?: string | null; notes?: string | null }
  ) => {
    const period = `${formatDate(booking.startDate)} - ${
      booking.endDate ? formatDate(booking.endDate) : 'Ongoing'
    }`;

    setReceiptData({
      receiptNo: payment.receiptNo || payment.receivedAt.slice(0, 10).replace(/-/g, '').toUpperCase(),
      studentName: booking.student.name,
      studentPhone: booking.student.phone,
      paymentType: 'booking',
      cabinNum: booking.cabin.cabinNum,
      bookingType: booking.type,
      bookingPeriod: period,
      amount: payment.amount,
      mode: payment.mode,
      paidAt: payment.receivedAt,
      notes: payment.notes || booking.notes || undefined,
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

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.student.name.toLowerCase().includes(q) ||
        b.student.phone.toLowerCase().includes(q) ||
        String(b.cabin.cabinNum).includes(q)
      );
    });
  }, [bookings, searchQuery]);

  // KPI Metrics calculation
  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) => b.status === 'active');
    const totalDuePaise = active.reduce(
      (sum, b) => sum + Math.max(0, b.totalAmount - b.paidAmount),
      0
    );
    const dueCount = active.filter((b) => b.totalAmount > b.paidAmount).length;
    return {
      total,
      activeCount: active.length,
      totalDuePaise,
      dueCount,
    };
  }, [bookings]);

  const handleOpenManage = (booking: Booking) => {
    setSelectedBookingForManage(booking);
    setManageDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total Bookings</span>
              <Building className="h-4 w-4 text-cyan-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
            <p className="text-[11px] text-slate-400">All historical records</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Active Desks</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-600">{stats.activeCount}</p>
            <p className="text-[11px] text-slate-400">Currently occupied desks</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Uncollected Dues</span>
              <CreditCard className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-xl font-bold text-rose-600">{formatCurrency(stats.totalDuePaise)}</p>
            <p className="text-[11px] text-slate-400">{stats.dueCount} active students with dues</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            if (pendingCount > 0) setStatusFilter('pending');
          }}
          className={cn(
            'border shadow-xs transition-colors',
            pendingCount > 0
              ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 cursor-pointer'
              : 'border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60'
          )}
        >
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={pendingCount > 0 ? 'text-amber-900 font-semibold' : 'text-slate-500'}>
                Pending Review
              </span>
              <AlertTriangle className={cn('h-4 w-4', pendingCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400')} />
            </div>
            <p className={cn('text-xl font-bold', pendingCount > 0 ? 'text-amber-700' : 'text-slate-900 dark:text-slate-100')}>
              {pendingCount}
            </p>
            <p className="text-[11px] text-slate-400">
              {pendingCount > 0 ? 'Click to review pending requests' : 'Zero pending requests'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert Banner */}
      {pendingCount > 0 && statusFilter !== 'pending' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              You have {pendingCount} pending booking request{pendingCount !== 1 ? 's' : ''} awaiting staff approval.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStatusFilter('pending')}
            className="border-amber-400 text-amber-900 hover:bg-amber-200/60 h-7 text-xs self-start sm:self-auto font-medium"
          >
            Review Pending
          </Button>
        </div>
      )}

      {/* Controls: Search, Filters & Dual View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search student or cabin..."
              className="pl-8 h-8.5 text-xs bg-slate-50 dark:bg-slate-800/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Shift Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[125px] h-8.5 text-xs bg-slate-50 dark:bg-slate-800/50">
              <SelectValue placeholder="Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Shifts</SelectItem>
              <SelectItem value="reserved" className="text-xs">Reserved (24/7)</SelectItem>
              <SelectItem value="morning_shift" className="text-xs">Morning Shift</SelectItem>
              <SelectItem value="day_shift" className="text-xs">Day Shift</SelectItem>
              <SelectItem value="night_shift" className="text-xs">Night Shift</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[125px] h-8.5 text-xs bg-slate-50 dark:bg-slate-800/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="active" className="text-xs">Active</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8.5 text-xs justify-start text-left font-normal bg-slate-50 dark:bg-slate-800/50"
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                {dateFilter ? formatDate(dateFilter.toISOString()) : 'Date Filter'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={(d) => setDateFilter(d)}
              />
              {dateFilter && (
                <div className="p-2 border-t text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => setDateFilter(undefined)}
                  >
                    Clear Date Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* View Switcher: Table vs 3-Col Cards */}
        <div className="flex items-center gap-1 self-end md:self-auto rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800/60">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'h-7.5 px-3 text-xs font-medium rounded-md transition-all',
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <LayoutList className="h-3.5 w-3.5 mr-1.5" />
            Table View
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            type="button"
            onClick={() => setViewMode('cards')}
            className={cn(
              'h-7.5 px-3 text-xs font-medium rounded-md transition-all',
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
            3-Col Cards
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-12 text-center text-slate-400 space-y-2">
            <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">No bookings match your criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search keywords</p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Responsive Table View */
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-[100px] text-xs font-bold">Cabin Desk</TableHead>
                  <TableHead className="text-xs font-bold">Student</TableHead>
                  <TableHead className="text-xs font-bold">Shift Type</TableHead>
                  <TableHead className="text-xs font-bold">Period & Duration</TableHead>
                  <TableHead className="w-[200px] text-xs font-bold">Payment Progress</TableHead>
                  <TableHead className="w-[100px] text-xs font-bold text-center">Status</TableHead>
                  <TableHead className="w-[90px] text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const pending = Math.max(0, booking.totalAmount - booking.paidAmount);
                  const percent = booking.totalAmount > 0
                    ? Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100))
                    : 100;

                  return (
                    <TableRow
                      key={booking.id}
                      onClick={() => handleOpenManage(booking)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Cabin Desk */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            #{booking.cabin.cabinNum}
                          </span>
                        </div>
                      </TableCell>

                      {/* Student */}
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs group-hover:text-cyan-600 transition-colors">
                            {booking.student.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{booking.student.phone}</p>
                        </div>
                      </TableCell>

                      {/* Shift Type */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] capitalize font-medium',
                            booking.type === 'reserved'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          )}
                        >
                          {booking.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>

                      {/* Period & Duration */}
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        <p>
                          {formatDate(booking.startDate)} &rarr; {booking.endDate ? formatDate(booking.endDate) : 'Ongoing'}
                        </p>
                      </TableCell>

                      {/* Payment Progress */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formatCurrency(booking.paidAmount)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{percent}%</span>
                          </div>
                          <Progress
                            value={percent}
                            className={cn(
                              'h-1.5',
                              percent === 100 ? 'bg-emerald-100' : 'bg-slate-100'
                            )}
                          />
                          {pending > 0 ? (
                            <span className="text-[10px] font-bold text-rose-600">
                              Due: {formatCurrency(pending)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-600">
                              All Paid ({booking.payments.length} receipts)
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-medium capitalize',
                            booking.status === 'active' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            booking.status === 'pending' && 'bg-amber-50 text-amber-800 border-amber-200',
                            booking.status === 'completed' && 'bg-slate-100 text-slate-700 border-slate-200',
                            booking.status === 'cancelled' && 'bg-rose-50 text-rose-800 border-rose-200'
                          )}
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenManage(booking);
                          }}
                          className="h-7 text-xs text-cyan-700 border-cyan-300 hover:bg-cyan-50 font-medium shadow-2xs"
                        >
                          Manage <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Adaptive List Cards */}
          <div className="block sm:hidden space-y-3">
            {filteredBookings.map((booking) => {
              const pending = Math.max(0, booking.totalAmount - booking.paidAmount);
              const percent = booking.totalAmount > 0
                ? Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100))
                : 100;

              return (
                <div
                  key={booking.id}
                  onClick={() => handleOpenManage(booking)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs active:scale-[0.99] transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                        Desk #{booking.cabin.cabinNum}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {booking.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-medium capitalize',
                        booking.status === 'active' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                        booking.status === 'pending' && 'bg-amber-50 text-amber-800 border-amber-200',
                        booking.status === 'completed' && 'bg-slate-100 text-slate-700 border-slate-200',
                        booking.status === 'cancelled' && 'bg-rose-50 text-rose-800 border-rose-200'
                      )}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{booking.student.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>📞 {booking.student.phone}</span>
                      <span>&bull;</span>
                      <span>📅 {formatDate(booking.startDate)} - {booking.endDate ? formatDate(booking.endDate) : 'Ongoing'}</span>
                    </p>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        Paid: {formatCurrency(booking.paidAmount)} / {formatCurrency(booking.totalAmount)}
                      </span>
                      {pending > 0 ? (
                        <span className="text-rose-600 font-bold text-xs">Due: {formatCurrency(pending)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px]">All Paid ✓</span>
                      )}
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-cyan-600 font-medium pt-0.5">
                    <span>{booking.payments.length} payment records</span>
                    <span className="flex items-center gap-0.5">
                      Tap to manage <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3-Column Compact Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((booking) => {
            const pending = Math.max(0, booking.totalAmount - booking.paidAmount);
            const percent = booking.totalAmount > 0
              ? Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100))
              : 100;

            return (
              <Card
                key={booking.id}
                onClick={() => handleOpenManage(booking)}
                className={cn(
                  'cursor-pointer border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-cyan-400 transition-all rounded-xl overflow-hidden flex flex-col justify-between',
                  booking.status === 'cancelled' && 'opacity-60',
                  pending > 0 && booking.status === 'active' && 'border-rose-300 bg-rose-50/10'
                )}
              >
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md">
                        #{booking.cabin.cabinNum}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] capitalize font-medium',
                          booking.type === 'reserved'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        )}
                      >
                        {booking.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-medium capitalize',
                          booking.status === 'active' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          booking.status === 'pending' && 'bg-amber-50 text-amber-800 border-amber-200',
                          booking.status === 'completed' && 'bg-slate-100 text-slate-700 border-slate-200',
                          booking.status === 'cancelled' && 'bg-rose-50 text-rose-800 border-rose-200'
                        )}
                      >
                        {booking.status}
                      </Badge>
                      {pending > 0 && booking.status === 'active' && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Payment Due" />
                      )}
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {booking.student.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span>📞 {booking.student.phone}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatDate(booking.startDate)} &rarr; {booking.endDate ? formatDate(booking.endDate) : 'Ongoing'}
                    </p>
                  </div>

                  {/* Financial Mini Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Paid: {formatCurrency(booking.paidAmount)}
                      </span>
                      {pending > 0 ? (
                        <span className="text-rose-600 font-bold">Due: {formatCurrency(pending)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px]">All Paid ✓</span>
                      )}
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>

                  {/* Card Action Hint */}
                  <div className="flex items-center justify-between text-[11px] text-cyan-600 font-medium pt-1">
                    <span className="text-slate-400">{booking.payments.length} payments</span>
                    <span className="flex items-center gap-0.5 group-hover:underline">
                      Manage <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Master-Detail Booking Management Dialog */}
      <BookingManagementDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        booking={selectedBookingForManage}
        cabins={cabins}
        onUpdate={fetchBookings}
        onOpenPaymentDialog={openPaymentDialog}
        onOpenReceipt={openReceipt}
        onRenew={handleRenewBooking}
        onComplete={handleCompleteBooking}
        onCancel={handleCancelBooking}
      />

      {/* Payment Receipt Dialog */}
      <PaymentReceipt
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptData(null);
        }}
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
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode *</Label>
              <Select value={paymentMode} onValueChange={(v: 'cash' | 'upi') => setPaymentMode(v)}>
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
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt Number (Optional)</Label>
              <Input
                placeholder="e.g. REC-001"
                value={paymentReceiptNo}
                onChange={(e) => setPaymentReceiptNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Optional payment notes..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={paymentSubmitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {paymentSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
