'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Receipt,
  RefreshCw,
  Key,
  Copy,
  Check,
  DoorOpen,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import PaymentReceipt, { ReceiptData } from '@/components/payments/payment-receipt';

export interface InspectorStudent {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  username?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface InspectorPayment {
  id: string;
  amount: number;
  mode: string;
  receivedAt: string | Date;
  notes?: string | null;
  receiptNo?: string | null;
}

export interface InspectorBooking {
  id: string;
  type: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date | null;
  startTime?: string | null;
  endTime?: string | null;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
  student: InspectorStudent;
  payments?: InspectorPayment[];
}

export interface CabinContext {
  id: string;
  cabinNum: number;
  floor: number;
}

interface CabinStudentInspectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: InspectorBooking | null;
  cabin: CabinContext | null;
  onBookingUpdated?: () => void;
  onStudentUpdated?: () => void;
  onNavigateToStudents?: (studentId: string) => void;
}

export default function CabinStudentInspectorDialog({
  open,
  onOpenChange,
  booking,
  cabin,
  onBookingUpdated,
  onStudentUpdated,
  onNavigateToStudents,
}: CabinStudentInspectorDialogProps) {
  const [activeTab, setActiveTab] = useState<'booking' | 'student'>('booking');

  // Student Edit Form State
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);

  // Booking Action States
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Recording Modal State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('cash');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payReceiptNo, setPayReceiptNo] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Transfer Desk State
  const [transferMode, setTransferMode] = useState(false);
  const [availableCabins, setAvailableCabins] = useState<any[]>([]);
  const [selectedNewCabinId, setSelectedNewCabinId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [businessName, setBusinessName] = useState('Lamka Coaching');

  // Fetch business settings for receipts
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.business_name) setBusinessName(d.settings.business_name);
      })
      .catch(() => {});
  }, []);

  // Sync state when booking changes
  useEffect(() => {
    if (booking && open) {
      setStudentName(booking.student.name || '');
      setStudentPhone(booking.student.phone || '');
      setStudentEmail(booking.student.email || '');
      setStudentUsername(booking.student.username || '');
      setStudentAddress(booking.student.address || '');
      setStudentNotes(booking.student.notes || '');
      setNewPassword('');
      setCopiedPassword(false);
      setTransferMode(false);
      setSelectedNewCabinId('');
      setTransferNotes('');
    }
  }, [booking, open]);

  // Load available cabins when entering transfer mode
  useEffect(() => {
    if (transferMode && open) {
      fetch('/api/cabins')
        .then((r) => r.json())
        .then((data) => {
          if (data.cabins) {
            setAvailableCabins(data.cabins);
          }
        })
        .catch(() => {});
    }
  }, [transferMode, open]);

  if (!booking || !cabin) return null;

  const totalPaise = booking.totalAmount || 0;
  const paidPaise = booking.paidAmount || 0;
  const duePaise = Math.max(0, totalPaise - paidPaise);
  const isFullyPaid = duePaise === 0;
  const percentPaid = totalPaise > 0 ? Math.min(100, Math.round((paidPaise / totalPaise) * 100)) : 100;

  // Handle Save Student
  const handleSaveStudent = async () => {
    if (!studentName.trim() || !studentPhone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }

    setSavingStudent(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: booking.student.id,
          name: studentName.trim(),
          phone: studentPhone.trim(),
          email: studentEmail.trim() || null,
          username: studentUsername.trim() || null,
          address: studentAddress.trim() || null,
          notes: studentNotes.trim() || null,
          password: newPassword.trim() ? newPassword.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update student');
        return;
      }

      toast.success('Student details updated successfully');
      setNewPassword('');
      if (onStudentUpdated) onStudentUpdated();
    } catch {
      toast.error('Error updating student');
    } finally {
      setSavingStudent(false);
    }
  };

  // Handle Record Payment
  const handleRecordPayment = async () => {
    const amountVal = parseFloat(payAmount);
    if (!amountVal || amountVal <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: Math.round(amountVal * 100),
          mode: payMode,
          receivedAt: payDate ? new Date(payDate).toISOString() : new Date().toISOString(),
          notes: payNotes || undefined,
          receiptNo: payReceiptNo || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to record payment');
        return;
      }

      toast.success(`Payment of ₹${amountVal} recorded`);
      setPaymentDialogOpen(false);
      setPayAmount('');
      setPayNotes('');
      setPayReceiptNo('');
      if (onBookingUpdated) onBookingUpdated();
    } catch {
      toast.error('Error saving payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Quick Renew
  const handleRenew = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'renew', id: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to renew booking');
        return;
      }
      toast.success('Booking renewed to next month end');
      if (onBookingUpdated) onBookingUpdated();
    } catch {
      toast.error('Error renewing booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Release Desk
  const handleReleaseDesk = async () => {
    if (!confirm(`Are you sure you want to release Cabin #${cabin.cabinNum} for ${booking.student.name}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release_desk', id: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to release desk');
        return;
      }
      toast.success('Desk released successfully');
      onOpenChange(false);
      if (onBookingUpdated) onBookingUpdated();
    } catch {
      toast.error('Error releasing desk');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Complete Booking
  const handleComplete = async () => {
    if (!confirm(`Mark this booking as completed? This will free up the desk.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', id: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to complete booking');
        return;
      }
      toast.success('Booking marked as completed');
      onOpenChange(false);
      if (onBookingUpdated) onBookingUpdated();
    } catch {
      toast.error('Error completing booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Booking
  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel this booking? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', id: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to cancel booking');
        return;
      }
      toast.success('Booking cancelled');
      onOpenChange(false);
      if (onBookingUpdated) onBookingUpdated();
    } catch {
      toast.error('Error cancelling booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Transfer Desk
  const handleExecuteTransfer = async () => {
    if (!selectedNewCabinId) {
      toast.error('Please select a destination cabin');
      return;
    }
    setTransferring(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_cabin',
          id: booking.id,
          newCabinId: selectedNewCabinId,
          notes: transferNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Transfer failed');
        return;
      }
      toast.success('Student transferred to new cabin desk');
      setTransferMode(false);
      onOpenChange(false);
      if (onBookingUpdated) onBookingUpdated();
    } catch {
      toast.error('Error transferring cabin');
    } finally {
      setTransferring(false);
    }
  };

  // View Receipt Modal trigger
  const handleViewReceipt = (payment: InspectorPayment) => {
    setReceiptData({
      receiptNo: payment.receiptNo || String(payment.id).slice(-6).toUpperCase(),
      studentName: booking.student.name,
      studentPhone: booking.student.phone,
      cabinNum: cabin.cabinNum,
      bookingType: booking.type.replace('_', ' ').toUpperCase(),
      bookingPeriod: `${booking.startDate ? formatDate(String(booking.startDate)) : ''} – ${booking.endDate ? formatDate(String(booking.endDate)) : 'Ongoing'}`,
      paymentType: 'booking',
      amount: payment.amount,
      mode: payment.mode,
      paidAt: String(payment.receivedAt),
      notes: payment.notes || undefined,
      businessName,
    });
    setReceiptOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setCopiedPassword(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&_[data-slot=dialog-close]]:text-white/80 [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:hover:bg-white/15 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:transition-colors">
          {/* Top Banner Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white rounded-t-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
                    <User className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      {booking.student.name}
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-[10px] uppercase font-semibold">
                        {booking.type.replace('_', ' ')}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-300 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-cyan-400" /> {booking.student.phone}
                      </span>
                      {booking.student.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-cyan-400" /> {booking.student.email}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </div>

              {/* Desk Badge */}
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 backdrop-blur-xs">
                <DoorOpen className="h-4 w-4 text-cyan-400" />
                <div className="text-right">
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-300">Assigned Desk</p>
                  <p className="text-sm font-bold text-white leading-tight">Cabin #{cabin.cabinNum}</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'booking' | 'student')}
              className="mt-5 w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/90 p-1 border border-white/10 rounded-xl">
                <TabsTrigger
                  value="booking"
                  className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-300 hover:text-white data-[state=inactive]:text-slate-300 text-xs font-semibold py-1.5 transition-all"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Booking & Payments
                </TabsTrigger>
                <TabsTrigger
                  value="student"
                  className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-300 hover:text-white data-[state=inactive]:text-slate-300 text-xs font-semibold py-1.5 transition-all"
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Edit Student Profile
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* TAB 1: BOOKING & PAYMENTS */}
            {activeTab === 'booking' && (
              <div className="space-y-6">
                {/* Financial Summary Card */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Payment Status</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xl font-bold text-slate-900">{formatCurrency(paidPaise)}</span>
                        <span className="text-xs text-slate-400">of {formatCurrency(totalPaise)}</span>
                      </div>
                    </div>
                    <div>
                      {isFullyPaid ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Fully Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-300 text-xs flex items-center gap-1 font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Due: {formatCurrency(duePaise)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Progress value={percentPaid} className="h-2 bg-slate-200" />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Start Date</span>
                      <span className="font-semibold text-slate-700">
                        {booking.startDate ? formatDate(String(booking.startDate)) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">End Date</span>
                      <span className="font-semibold text-slate-700">
                        {booking.endDate ? formatDate(String(booking.endDate)) : 'Open cycle'}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block text-[11px]">Shift Timing</span>
                      <span className="font-semibold text-slate-700">
                        {booking.startTime && booking.endTime
                          ? `${booking.startTime} – ${booking.endTime}`
                          : booking.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => {
                      setPayAmount(duePaise > 0 ? (duePaise / 100).toString() : '');
                      setPaymentDialogOpen(true);
                    }}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-9 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>

                  <Button
                    onClick={handleRenew}
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-semibold rounded-xl h-9 cursor-pointer flex items-center gap-1.5"
                    title="Renew booking to next calendar month end"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 text-amber-600", actionLoading && "animate-spin")} />
                    Renew Month
                  </Button>

                  <Button
                    onClick={() => setTransferMode(!transferMode)}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl h-9 cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-600" />
                    {transferMode ? 'Cancel Transfer' : 'Transfer Desk'}
                  </Button>

                  <Button
                    onClick={handleReleaseDesk}
                    disabled={actionLoading}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl h-9 ml-auto cursor-pointer flex items-center gap-1.5"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Release Desk
                  </Button>
                </div>

                {/* Transfer Desk Selector Panel */}
                {transferMode && (
                  <div className="rounded-xl border-2 border-cyan-400/40 bg-cyan-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-cyan-700" />
                      <h4 className="text-sm font-bold text-cyan-950">Transfer Student to Another Desk</h4>
                    </div>
                    <p className="text-xs text-cyan-800">
                      Select an available cabin desk to reassign this student without changing their payment records.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Select Destination Cabin</Label>
                        <Select value={selectedNewCabinId} onValueChange={setSelectedNewCabinId}>
                          <SelectTrigger className="bg-white h-9 text-xs">
                            <SelectValue placeholder="Choose a cabin desk..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCabins
                              .filter((c) => c.id !== cabin.id && c.status === 'active')
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  Cabin #{c.cabinNum} (Floor {c.floor}) — {c.bookings?.length ? `${c.bookings.length} active shift(s)` : 'Vacant'}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Reason / Transfer Notes (Optional)</Label>
                        <Input
                          placeholder="e.g. Swapped desk on student request"
                          value={transferNotes}
                          onChange={(e) => setTransferNotes(e.target.value)}
                          className="bg-white h-9 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTransferMode(false)}
                        className="text-xs h-8"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleExecuteTransfer}
                        disabled={transferring || !selectedNewCabinId}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-8 font-semibold"
                      >
                        {transferring ? 'Transferring...' : 'Confirm Transfer'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Past Payments History */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-slate-500" />
                      Payment History ({booking.payments?.length || 0})
                    </h4>
                  </div>

                  {booking.payments && booking.payments.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                      {booking.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                              <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                                {p.mode}
                              </Badge>
                              {p.receiptNo && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{p.receiptNo}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {p.receivedAt ? formatDate(String(p.receivedAt)) : 'N/A'}
                              {p.notes && ` • ${p.notes}`}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReceipt(p)}
                            className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50 h-7 px-2 text-xs cursor-pointer flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" />
                            Receipt
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      No payments recorded yet for this booking.
                    </div>
                  )}
                </div>

                {/* Additional Booking Lifecycle Options */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Lifecycle actions:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={actionLoading}
                      className="hover:text-emerald-700 font-medium underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Complete Booking
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="hover:text-red-700 font-medium underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EDIT STUDENT PROFILE */}
            {activeTab === 'student' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Student full name"
                      className="text-xs sm:text-sm h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                    <Input
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="text-xs sm:text-sm h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                    <Input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="text-xs sm:text-sm h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Username / Login ID</Label>
                    <Input
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value)}
                      placeholder="login username"
                      className="text-xs sm:text-sm h-9 font-mono"
                    />
                  </div>
                </div>

                {/* Reset Password Field */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-slate-500" />
                      Reset Student Password
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateRandomPassword}
                      className="text-[11px] h-6 px-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer"
                    >
                      Auto Generate
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Leave blank to keep current password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-xs sm:text-sm h-9 bg-white font-mono"
                    />
                    {newPassword && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(newPassword);
                          setCopiedPassword(true);
                          toast.success('Password copied to clipboard');
                          setTimeout(() => setCopiedPassword(false), 2000);
                        }}
                        className="h-9 px-3 shrink-0"
                      >
                        {copiedPassword ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Entering a new password will immediately update the student's portal login credentials.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Address (Optional)</Label>
                  <Input
                    value={studentAddress}
                    onChange={(e) => setStudentAddress(e.target.value)}
                    placeholder="Residential address..."
                    className="text-xs sm:text-sm h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Internal Staff Notes</Label>
                  <Textarea
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    placeholder="Notes visible to staff only..."
                    rows={2}
                    className="text-xs sm:text-sm resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  {onNavigateToStudents && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToStudents(booking.student.id)}
                      className="text-xs text-slate-500 hover:text-cyan-700 flex items-center gap-1.5 px-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Full Academic & Payment History in Students
                    </Button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="text-xs h-9"
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveStudent}
                      disabled={savingStudent}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold h-9 px-4 rounded-xl cursor-pointer"
                    >
                      {savingStudent ? 'Saving...' : 'Save Student Details'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Record Booking Payment
            </DialogTitle>
            <DialogDescription className="sr-only">
              Record payment for this cabin booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1 border border-slate-100">
              <p className="font-semibold text-slate-800">{booking.student.name} — Cabin #{cabin.cabinNum}</p>
              <div className="flex items-center justify-between text-slate-500">
                <span>Remaining Due:</span>
                <span className="font-bold text-red-600">{formatCurrency(duePaise)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Payment Amount (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount in Rupees"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="text-base font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Payment Mode</Label>
                <Select value={payMode} onValueChange={(v) => setPayMode(v as 'cash' | 'upi')}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI / Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Payment Date</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Receipt No. (Optional)</Label>
              <Input
                placeholder="Leave blank to auto-generate"
                value={payReceiptNo}
                onChange={(e) => setPayReceiptNo(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Notes (Optional)</Label>
              <Input
                placeholder="e.g. Paid in full for September"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentDialogOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRecordPayment}
              disabled={submittingPayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-xl"
            >
              {submittingPayment ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Receipt Dialog */}
      <PaymentReceipt
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
      />
    </>
  );
}
