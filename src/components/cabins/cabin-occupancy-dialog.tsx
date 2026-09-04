'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DoorOpen,
  User,
  Phone,
  Calendar,
  Plus,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Building2,
  CalendarPlus,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import CabinStudentInspectorDialog, {
  InspectorBooking,
  CabinContext,
} from './cabin-student-inspector-dialog';

interface CabinOccupancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabin: {
    id: string;
    floor: number;
    cabinNum: number;
    status: string;
    notes?: string | null;
    bookings: any[];
  } | null;
  onBookShift: (cabin: any, shiftType?: string) => void;
  onRefresh: () => void;
  isAdmin?: boolean;
}

const ALL_SHIFTS = [
  { key: 'morning_shift', label: 'Morning Shift', hours: '07:00 – 12:00' },
  { key: 'day_shift', label: 'Day Shift', hours: '12:00 – 17:00' },
  { key: 'night_shift', label: 'Night Shift', hours: '17:00 – 22:00' },
];

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

export default function CabinOccupancyDialog({
  open,
  onOpenChange,
  cabin,
  onBookShift,
  onRefresh,
  isAdmin,
}: CabinOccupancyDialogProps) {
  const [selectedBooking, setSelectedBooking] = useState<InspectorBooking | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  if (!cabin) return null;

  const activeBookings: InspectorBooking[] = (cabin.bookings || []).filter(
    (b: any) => b.status === 'active' || b.status === 'pending_payment'
  );

  const isReserved = activeBookings.some((b) => b.type === 'reserved');
  const bookedShiftTypes = new Set(activeBookings.map((b) => b.type));
  const availableShifts = isReserved
    ? []
    : ALL_SHIFTS.filter((s) => !bookedShiftTypes.has(s.key));

  const cabinContext: CabinContext = {
    id: cabin.id,
    cabinNum: cabin.cabinNum,
    floor: cabin.floor,
  };

  const handleOpenStudent = (b: InspectorBooking) => {
    setSelectedBooking(b);
    setInspectorOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&_[data-slot=dialog-close]]:text-white/80 [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:hover:bg-white/15 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:transition-colors">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-cyan-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
                <DoorOpen className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  Cabin #{cabin.cabinNum}
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-[10px] uppercase font-semibold">
                    {formatFloorLabel(cabin.floor)}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3 w-3 text-cyan-400" />
                  {isReserved
                    ? 'Fully Booked (Full Day Reserved)'
                    : `${activeBookings.length} of 3 shifts occupied`}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Book Button if any shift is available */}
            {availableShifts.length > 0 && !isReserved && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onBookShift(cabin, availableShifts[0]?.key);
                }}
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs h-8 px-3 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Book Shift
              </Button>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Occupants List Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Student Occupants ({activeBookings.length})
                </span>
                <span className="text-[11px] text-slate-400">Click student to edit or manage</span>
              </div>

              {activeBookings.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-xl text-slate-400 text-xs">
                  No active bookings for this cabin desk.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeBookings.map((b) => {
                    const duePaise = Math.max(0, (b.totalAmount || 0) - (b.paidAmount || 0));
                    const isPaid = duePaise === 0;

                    return (
                      <div
                        key={b.id}
                        onClick={() => handleOpenStudent(b)}
                        className="group p-3.5 rounded-xl border border-slate-200/90 hover:border-cyan-400 bg-white hover:bg-cyan-50/30 transition-all cursor-pointer shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-cyan-100/70 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {b.student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-cyan-900 truncate">
                                {b.student.name}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                {b.student.phone}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 border-slate-200"
                            >
                              {b.type.replace('_', ' ')}
                            </Badge>
                            <div className="mt-1">
                              {isPaid ? (
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                                  <CheckCircle2 className="h-3 w-3" /> Paid
                                </span>
                              ) : (
                                <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5 justify-end">
                                  <AlertTriangle className="h-3 w-3" /> Due {formatCurrency(duePaise)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Timing & Action Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {b.startDate ? formatDate(String(b.startDate)) : ''} –{' '}
                            {b.endDate ? formatDate(String(b.endDate)) : 'Ongoing'}
                          </span>
                          <span className="text-cyan-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            Manage & Edit <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available Shifts (Remaining Slots) */}
            {availableShifts.length > 0 && !isReserved && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Available Shifts on this Desk ({availableShifts.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableShifts.map((shift) => (
                    <div
                      key={shift.key}
                      className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-emerald-900">{shift.label}</p>
                        <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {shift.hours}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          onBookShift(cabin, shift.key);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5 rounded-lg font-semibold cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Book
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2-Tab Student & Booking Inspector */}
      {selectedBooking && (
        <CabinStudentInspectorDialog
          open={inspectorOpen}
          onOpenChange={(v) => {
            setInspectorOpen(v);
            if (!v) onRefresh();
          }}
          booking={selectedBooking}
          cabin={cabinContext}
          onBookingUpdated={onRefresh}
          onStudentUpdated={onRefresh}
        />
      )}
    </>
  );
}
