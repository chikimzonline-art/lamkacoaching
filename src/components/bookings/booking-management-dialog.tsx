'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  User,
  Phone,
  Calendar,
  Building,
  CreditCard,
  Receipt,
  RefreshCw,
  Check,
  X,
  ArrowRightLeft,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export interface BookingPayment {
  id: string;
  amount: number;
  mode: string;
  receivedAt: string;
  notes?: string | null;
  receiptNo?: string | null;
}

export interface Booking {
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
  student: { id: string; name: string; phone: string; email?: string };
  cabin: { id: string; cabinNum: number; floor?: number; status: string };
  payments: BookingPayment[];
}

export interface CabinOption {
  id: string;
  cabinNum: number;
  floor?: number;
  status: string;
  bookings?: {
    id: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string | null;
    student: { id: string; name: string; phone: string };
  }[];
}

interface BookingManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  cabins: CabinOption[];
  onUpdate: () => void;
  onOpenPaymentDialog: (booking: Booking) => void;
  onOpenReceipt: (booking: Booking, payment: BookingPayment) => void;
  onRenew: (booking: Booking) => Promise<void>;
  onComplete: (booking: Booking) => Promise<void>;
  onCancel: (booking: Booking) => Promise<void>;
}

// Evaluate whether a cabin is compatible with the booking being transferred
function evaluateCabinTransferStatus(cabin: CabinOption, currentBooking: Booking) {
  if (cabin.id === currentBooking.cabin.id) {
    return {
      isCurrent: true,
      isMaintenance: false,
      hasConflict: true,
      conflictReason: 'Student is currently assigned to this cabin desk.',
      badgeType: 'current' as const,
      badgeLabel: 'Current Desk',
      occupantSummary: 'Current assignment',
    };
  }

  if (cabin.status !== 'active') {
    return {
      isCurrent: false,
      isMaintenance: true,
      hasConflict: true,
      conflictReason: `Cabin #${cabin.cabinNum} is currently ${cabin.status} (under maintenance/inactive).`,
      badgeType: 'maintenance' as const,
      badgeLabel: cabin.status === 'maintenance' ? 'Maintenance' : 'Inactive',
      occupantSummary: 'Desk not in service',
    };
  }

  const activeBookings = (cabin.bookings || []).filter(
    (b) => b.status === 'active' || b.status === 'pending_payment'
  );

  // If 100% available
  if (activeBookings.length === 0) {
    return {
      isCurrent: false,
      isMaintenance: false,
      hasConflict: false,
      conflictReason: '',
      badgeType: 'available' as const,
      badgeLabel: 'Available (100% Free)',
      occupantSummary: 'No active occupants',
    };
  }

  // Check for 24/7 Reserved conflict
  const reservedBooking = activeBookings.find((b) => b.type === 'reserved');
  if (reservedBooking) {
    return {
      isCurrent: false,
      isMaintenance: false,
      hasConflict: true,
      conflictReason: `Occupied under 24/7 Reserved booking by ${reservedBooking.student?.name || 'Student'} (📞 ${reservedBooking.student?.phone || 'N/A'}).`,
      badgeType: 'occupied' as const,
      badgeLabel: `Occupied: Reserved (${reservedBooking.student?.name || 'Student'})`,
      occupantSummary: `Reserved by ${reservedBooking.student?.name} (${reservedBooking.student?.phone})`,
    };
  }

  // If current booking is Reserved, it needs all shifts free
  if (currentBooking.type === 'reserved') {
    const occupantNames = activeBookings
      .map((b) => `${b.student?.name} (${b.type.replace('_', ' ')})`)
      .join(', ');
    return {
      isCurrent: false,
      isMaintenance: false,
      hasConflict: true,
      conflictReason: `Cannot transfer 24/7 Reserved desk: Desk already has active shifts: ${occupantNames}.`,
      badgeType: 'occupied' as const,
      badgeLabel: `Occupied (${activeBookings.length} shift${activeBookings.length > 1 ? 's' : ''})`,
      occupantSummary: occupantNames,
    };
  }

  // If current booking has a specific shift (morning, day, night)
  const sameShiftBooking = activeBookings.find((b) => b.type === currentBooking.type);
  if (sameShiftBooking) {
    return {
      isCurrent: false,
      isMaintenance: false,
      hasConflict: true,
      conflictReason: `${currentBooking.type.replace('_', ' ')} is already booked by ${sameShiftBooking.student?.name || 'Student'} (📞 ${sameShiftBooking.student?.phone || 'N/A'}).`,
      badgeType: 'occupied' as const,
      badgeLabel: `Occupied: ${currentBooking.type.replace('_', ' ')} (${sameShiftBooking.student?.name || 'Student'})`,
      occupantSummary: `Booked by ${sameShiftBooking.student?.name} (${sameShiftBooking.student?.phone})`,
    };
  }

  // Compatible for shift sharing!
  const otherShifts = activeBookings
    .map((b) => `${b.type.replace('_', ' ')}: ${b.student?.name}`)
    .join(' · ');
  return {
    isCurrent: false,
    isMaintenance: false,
    hasConflict: false,
    conflictReason: '',
    badgeType: 'compatible' as const,
    badgeLabel: `Available for ${currentBooking.type.replace('_', ' ')}`,
    occupantSummary: `Other shifts: ${otherShifts}`,
  };
}

export function BookingManagementDialog({
  open,
  onOpenChange,
  booking,
  cabins,
  onUpdate,
  onOpenPaymentDialog,
  onOpenReceipt,
  onRenew,
  onComplete,
  onCancel,
}: BookingManagementDialogProps) {
  const [transferMode, setTransferMode] = useState(false);
  const [selectedNewCabinId, setSelectedNewCabinId] = useState('');
  const [floorFilter, setFloorFilter] = useState<'all' | number>('all');
  const [cabinSearchQuery, setCabinSearchQuery] = useState('');
  const [liveCabins, setLiveCabins] = useState<CabinOption[]>(cabins || []);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Auto-fetch full cabin inventory on modal open
  useEffect(() => {
    if (open) {
      fetch('/api/cabins')
        .then((r) => r.json())
        .then((data) => {
          if (data.cabins) {
            setLiveCabins(data.cabins);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  // Reset transfer state on dialog toggle
  useEffect(() => {
    if (!open) {
      setTransferMode(false);
      setSelectedNewCabinId('');
      setCabinSearchQuery('');
      setFloorFilter('all');
      setTransferNotes('');
    }
  }, [open]);

  // Unique floors available in inventory (top-level hook)
  const uniqueFloors = useMemo(() => {
    const set = new Set<number>();
    liveCabins.forEach((c) => {
      if (c.floor) set.add(c.floor);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [liveCabins]);

  // Filtered cabins list based on floor and search query (top-level hook)
  const displayedCabins = useMemo(() => {
    return liveCabins
      .filter((c) => {
        // Floor filter
        if (floorFilter !== 'all' && c.floor !== floorFilter) return false;
        
        // Search query filter
        if (cabinSearchQuery.trim()) {
          const q = cabinSearchQuery.toLowerCase().trim();
          const cleanDigits = q.replace(/[^0-9]/g, '');
          const isNumericQuery = /^\d+$/.test(q);

          // If typing pure digits (e.g. "25"), match strictly against cabinNum
          if (isNumericQuery) {
            return String(c.cabinNum).includes(q);
          }

          // If query mentions "cabin" followed by digits (e.g. "cabin 25" or "#25")
          if ((q.includes('cabin') || q.startsWith('#')) && cleanDigits) {
            return String(c.cabinNum).includes(cleanDigits);
          }

          // Otherwise match floor or student occupant name (letters)
          const matchFloor = `floor ${c.floor}`.includes(q);
          const matchOccupant = (c.bookings || []).some(
            (b) => b.student?.name?.toLowerCase().includes(q)
          );
          return matchFloor || matchOccupant;
        }
        return true;
      })
      .sort((a, b) => {
        if ((a.floor || 3) !== (b.floor || 3)) {
          return (a.floor || 3) - (b.floor || 3);
        }
        return a.cabinNum - b.cabinNum;
      });
  }, [liveCabins, floorFilter, cabinSearchQuery]);

  if (!booking) return null;

  const pendingAmount = Math.max(0, booking.totalAmount - booking.paidAmount);
  const paidPercent =
    booking.totalAmount > 0
      ? Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100))
      : 100;

  // Calculate approximate duration in months
  const durationMonths = (() => {
    if (!booking.startDate) return 1;
    const start = new Date(booking.startDate);
    const end = booking.endDate ? new Date(booking.endDate) : new Date(start);
    if (!booking.endDate) end.setMonth(end.getMonth() + 1);
    const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, diff);
  })();

  const handleSelectCabinItem = (cabin: CabinOption) => {
    const evalStatus = evaluateCabinTransferStatus(cabin, booking);
    if (evalStatus.hasConflict) {
      toast.error(`Cannot transfer to Cabin #${cabin.cabinNum}: ${evalStatus.conflictReason}`);
      return;
    }
    setSelectedNewCabinId(cabin.id);
    toast.success(`Selected Cabin #${cabin.cabinNum} (Floor ${cabin.floor || 3})`);
  };

  const handleExecuteTransfer = async () => {
    if (!selectedNewCabinId) {
      toast.error('Please select a destination cabin from the list');
      return;
    }
    if (selectedNewCabinId === booking.cabin.id) {
      toast.error('Student is already assigned to this cabin');
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

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to transfer cabin');
        return;
      }

      toast.success(json.message || 'Cabin transferred successfully!');
      setTransferMode(false);
      setSelectedNewCabinId('');
      setTransferNotes('');
      onUpdate();
      onOpenChange(false);
    } catch {
      toast.error('Failed to transfer cabin');
    } finally {
      setTransferring(false);
    }
  };

  const handleRenewClick = async () => {
    setActionLoading(true);
    try {
      await onRenew(booking);
      onUpdate();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteClick = async () => {
    if (
      !confirm(
        `Mark booking for ${booking.student.name} as completed? This will free up Cabin #${booking.cabin.cabinNum}.`
      )
    )
      return;
    setActionLoading(true);
    try {
      await onComplete(booking);
      onUpdate();
      onOpenChange(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClick = async () => {
    if (!confirm(`Are you sure you want to cancel the booking for ${booking.student.name}?`)) return;
    setActionLoading(true);
    try {
      await onCancel(booking);
      onUpdate();
      onOpenChange(false);
    } finally {
      setActionLoading(false);
    }
  };

  const selectedDestinationCabin = liveCabins.find((c) => c.id === selectedNewCabinId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building className="h-5 w-5 text-cyan-600" />
                  Cabin #{booking.cabin.cabinNum} &bull; Booking Management
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500">
                {booking.cabin.floor ? `Floor ${booking.cabin.floor}` : 'Main Floor'} &bull; Booking Ref: #{booking.id.slice(-6).toUpperCase()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs capitalize font-semibold',
                  booking.type === 'reserved'
                    ? 'bg-sky-100 text-sky-800 border-sky-200'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                )}
              >
                {booking.type.replace('_', ' ')}
              </Badge>

              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-semibold',
                  booking.status === 'active' && 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  booking.status === 'pending' && 'bg-amber-100 text-amber-800 border-amber-200',
                  booking.status === 'completed' && 'bg-slate-100 text-slate-700 border-slate-200',
                  booking.status === 'cancelled' && 'bg-rose-100 text-rose-800 border-rose-200'
                )}
              >
                {booking.status.toUpperCase()}
              </Badge>

              {pendingAmount > 0 && booking.status === 'active' && (
                <Badge variant="outline" className="text-xs bg-rose-100 text-rose-800 border-rose-200 font-semibold">
                  Due: {formatCurrency(pendingAmount)}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* Student & Desk Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Student Info */}
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-cyan-600" /> Student Profile
              </Label>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{booking.student.name}</p>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" /> {booking.student.phone}
              </p>
              {booking.student.email && (
                <p className="text-slate-500 text-xs truncate">{booking.student.email}</p>
              )}
            </div>

            {/* Timeline & Cabin Desk */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-4">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-cyan-600" /> Timeline & Desk
                </Label>
                {booking.status === 'active' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => setTransferMode(!transferMode)}
                    className="h-6 text-[11px] text-amber-700 hover:text-amber-800 hover:bg-amber-100/60 px-2 font-medium"
                  >
                    <ArrowRightLeft className="h-3 w-3 mr-1" />
                    {transferMode ? 'Close Transfer' : 'Transfer Desk'}
                  </Button>
                )}
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Cabin #{booking.cabin.cabinNum} {booking.cabin.floor ? `(Floor ${booking.cabin.floor})` : ''}
              </p>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                {formatDate(booking.startDate)} &rarr; {booking.endDate ? formatDate(booking.endDate) : 'Ongoing'}
              </p>
              <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-medium">
                {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'} Continuous
              </Badge>
            </div>
          </div>

          {/* Interactive Cabin Desk Transfer Visual Browser */}
          {transferMode && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 space-y-3 animate-in fade-in shadow-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <ArrowRightLeft className="h-4 w-4 text-amber-700" />
                  Select Destination Cabin Desk
                </p>
                <button
                  type="button"
                  onClick={() => setTransferMode(false)}
                  className="text-amber-700 hover:text-amber-900 text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Floor Tabs & Search Bar */}
              <div className="space-y-2 pt-0.5">
                {/* Floor Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-amber-900 font-semibold flex items-center gap-1 mr-1">
                    <Layers className="h-3 w-3 text-amber-700" /> Floor:
                  </span>
                  <button
                    type="button"
                    onClick={() => setFloorFilter('all')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      floorFilter === 'all'
                        ? 'bg-amber-700 text-white font-bold'
                        : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                    )}
                  >
                    All Floors ({liveCabins.length})
                  </button>
                  {uniqueFloors.map((fl) => {
                    const countOnFloor = liveCabins.filter((c) => c.floor === fl).length;
                    return (
                      <button
                        key={fl}
                        type="button"
                        onClick={() => setFloorFilter(fl)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                          floorFilter === fl
                            ? 'bg-amber-700 text-white font-bold'
                            : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                        )}
                      >
                        Floor {fl} ({countOnFloor})
                      </button>
                    );
                  })}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Type cabin number (e.g. 22) or student occupant..."
                    value={cabinSearchQuery}
                    onChange={(e) => setCabinSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white border-amber-200"
                  />
                </div>
              </div>

              {/* Scrollable Visual Inventory Grid */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                  <span>Showing {displayedCabins.length} cabins (Click to choose desk)</span>
                  {selectedDestinationCabin && (
                    <span className="font-bold text-emerald-700">
                      ✓ Selected: Cabin #{selectedDestinationCabin.cabinNum}
                    </span>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {displayedCabins.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 bg-white/60 rounded-lg text-xs">
                      No cabins found matching your search.
                    </div>
                  ) : (
                    displayedCabins.map((cabin) => {
                      const evalStatus = evaluateCabinTransferStatus(cabin, booking);
                      const isSelected = selectedNewCabinId === cabin.id;

                      return (
                        <div
                          key={cabin.id}
                          onClick={() => handleSelectCabinItem(cabin)}
                          className={cn(
                            'p-2.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between gap-2',
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                              : evalStatus.hasConflict
                              ? 'bg-white/70 border-slate-200 opacity-80 hover:bg-red-50/50 hover:border-red-300'
                              : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
                          )}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                Cabin #{cabin.cabinNum}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Floor {cabin.floor || 3}
                              </span>
                              {isSelected && (
                                <Badge className="bg-emerald-600 text-white text-[10px] h-4 py-0 font-semibold">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {evalStatus.occupantSummary}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {evalStatus.badgeType === 'available' && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Available
                              </Badge>
                            )}
                            {evalStatus.badgeType === 'compatible' && (
                              <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300 text-[10px] font-semibold">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Shift Free
                              </Badge>
                            )}
                            {evalStatus.badgeType === 'occupied' && (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-semibold">
                                <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Occupied
                              </Badge>
                            )}
                            {evalStatus.badgeType === 'current' && (
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 text-[10px]">
                                Current Desk
                              </Badge>
                            )}
                            {evalStatus.badgeType === 'maintenance' && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                                <Ban className="h-2.5 w-2.5 mr-1" /> {evalStatus.badgeLabel}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Transfer Reason & Confirm Bar */}
              <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-1 w-full">
                  <Input
                    placeholder="Transfer note (e.g. Student requested corner desk on Floor 2)..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="h-8 text-xs bg-white border-amber-200"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setTransferMode(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    onClick={handleExecuteTransfer}
                    disabled={transferring || !selectedNewCabinId}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs font-semibold"
                  >
                    {transferring ? 'Transferring...' : 'Confirm Desk Transfer'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary Cards */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[11px] text-slate-400">Total Billed</span>
                <p className="text-base font-bold text-white">{formatCurrency(booking.totalAmount)}</p>
              </div>
              <div>
                <span className="text-[11px] text-emerald-400">Total Paid</span>
                <p className="text-base font-bold text-emerald-400">{formatCurrency(booking.paidAmount)}</p>
              </div>
              <div>
                <span className="text-[11px] text-rose-400">Balance Due</span>
                <p className="text-base font-bold text-rose-400">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>

            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>Payment Completion</span>
                <span className="font-mono font-semibold">{paidPercent}% Paid</span>
              </div>
              <Progress value={paidPercent} className="h-2 bg-slate-800" />
            </div>
          </div>

          {/* Complete Payment History Ledger */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-cyan-600" />
                Payment History ({booking.payments.length} Records)
              </Label>
              {pendingAmount > 0 && booking.status === 'active' && (
                <Button
                  size="sm"
                  type="button"
                  onClick={() => onOpenPaymentDialog(booking)}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  + Record Payment
                </Button>
              )}
            </div>

            {booking.payments.length === 0 ? (
              <div className="p-4 text-center text-slate-400 border border-dashed rounded-xl bg-slate-50/50 text-xs">
                No payments recorded yet for this booking.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {booking.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                          {p.mode}
                        </span>
                        {p.receiptNo && (
                          <span className="text-[10px] font-mono text-slate-500">
                            #{p.receiptNo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {formatDate(p.receivedAt)} {p.notes ? `&bull; ${p.notes}` : ''}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => onOpenReceipt(booking, p)}
                      className="h-7 px-2.5 text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                    >
                      <Receipt className="h-3 w-3 mr-1" />
                      Receipt
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Audit trail */}
          {booking.notes && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="h-3 w-3 text-slate-400" /> Booking Notes:
              </span>
              <p className="italic">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Destructive / Status Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {booking.status === 'active' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleCancelClick}
                  disabled={actionLoading}
                  className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleCompleteClick}
                  disabled={actionLoading}
                  className="h-8 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Complete
                </Button>
              </>
            )}
          </div>

          {/* Primary Operations */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Close
            </Button>

            {booking.status === 'active' && (
              <Button
                size="sm"
                type="button"
                onClick={handleRenewClick}
                disabled={actionLoading}
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Renew +1 Month
              </Button>
            )}

            {pendingAmount > 0 && booking.status === 'active' && (
              <Button
                size="sm"
                type="button"
                onClick={() => onOpenPaymentDialog(booking)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1" />
                Pay Due ({formatCurrency(pendingAmount)})
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
