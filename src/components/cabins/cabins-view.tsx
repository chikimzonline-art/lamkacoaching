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
import { Plus, DoorOpen, Wrench, X, Building2, Layers, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface CabinBooking {
  id: string;
  type: string;
  status: string;
  student: { id: string; name: string; phone: string };
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
}

interface Cabin {
  id: string;
  floor: number;
  cabinNum: number;
  status: string;
  notes: string | null;
  bookings: CabinBooking[];
}

type CabinDisplayState = 'available' | 'reserved' | 'shift' | 'timeslot-full' | 'inactive';
type FilterType = 'all' | CabinDisplayState;

// Parse "HH:MM" to minutes from midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Merge overlapping time intervals and return array of [start, end] in minutes
function mergeTimeSlots(bookings: { startTime: string; endTime: string }[]): { start: number; end: number }[] {
  if (bookings.length === 0) return [];
  const slots = bookings
    .map((b) => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }))
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [slots[0]];
  for (let i = 1; i < slots.length; i++) {
    const last = merged[merged.length - 1];
    if (slots[i].start <= last.end) {
      last.end = Math.max(last.end, slots[i].end);
    } else {
      merged.push(slots[i]);
    }
  }
  return merged;
}

function isTimeslotFullyCovered(
  shiftBookings: { startTime: string | null; endTime: string | null }[]
): boolean {
  const shifts = new Set(shiftBookings.map((b) => b.startTime));
  return shifts.has('05:00') && shifts.has('10:00') && shifts.has('17:00');
}

function getCabinDisplayState(
  cabin: Cabin,
  opStart: string,
  opEnd: string
): CabinDisplayState {
  if (cabin.status === 'inactive' || cabin.status === 'maintenance') return 'inactive';
  const reservedBooking = cabin.bookings.find((b) => b.type === 'reserved' && b.status === 'active');
  if (reservedBooking) return 'reserved';

  const shiftBookings = cabin.bookings.filter((b) => b.type === 'shift' && b.status === 'active');
  if (shiftBookings.length === 0) return 'available';

  if (isTimeslotFullyCovered(shiftBookings)) return 'timeslot-full';

  return 'shift';
}

function getDisplayStyles(state: CabinDisplayState) {
  switch (state) {
    case 'available':
      return 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-400';
    case 'reserved':
      return 'border-red-300 bg-red-50/50 hover:border-red-400';
    case 'shift':
      return 'border-sky-300 bg-sky-50/50 hover:border-sky-400';
    case 'timeslot-full':
      return 'border-sky-300 bg-sky-50/50 hover:border-sky-400';
    case 'inactive':
      return 'border-gray-300 bg-gray-50 hover:border-gray-400 opacity-70';
    default:
      return 'border-gray-200 bg-white';
  }
}

function getStatusBadge(state: CabinDisplayState) {
  switch (state) {
    case 'available':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">Available</Badge>;
    case 'reserved':
      return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Reserved</Badge>;
    case 'shift':
      return <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs">Shift</Badge>;
    case 'timeslot-full':
      return <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs">Fully Booked</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">Inactive</Badge>;
    default:
      return null;
  }
}

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

export default function CabinsView() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<FilterType>('all');
  const [activeFloor, setActiveFloor] = useState<number | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [singleCabinNum, setSingleCabinNum] = useState('');
  const [addFloor, setAddFloor] = useState<string>('');
  const [bulkCount, setBulkCount] = useState('');
  const [bulkFloor, setBulkFloor] = useState<string>('');
  const [deleteFloorDialogOpen, setDeleteFloorDialogOpen] = useState(false);
  const [deleteFloorNum, setDeleteFloorNum] = useState<number | null>(null);
  const [deleteFloorConfirm, setDeleteFloorConfirm] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editCabinNum, setEditCabinNum] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Operating hours from settings
  const [opStart, setOpStart] = useState('07:00');
  const [opEnd, setOpEnd] = useState('22:00');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.settings) {
        setOpStart(json.settings.operating_hours_start || '07:00');
        setOpEnd(json.settings.operating_hours_end || '22:00');
      }
    } catch {
      // use defaults
    }
  }, []);

  const fetchCabins = useCallback(async () => {
    try {
      const res = await fetch('/api/cabins');
      const json = await res.json();
      if (json.cabins) setCabins(json.cabins);
      if (json.floors) setFloors(json.floors);
    } catch (err) {
      console.error('Failed to fetch cabins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update default floors when floors data is loaded
  useEffect(() => {
    if (floors.length > 0) {
      const lowestFloor = floors[0]; // floors are sorted ascending
      if (!addFloor) setAddFloor(String(lowestFloor));
      if (!bulkFloor) setBulkFloor(String(lowestFloor));
    }
  }, [floors, addFloor, bulkFloor]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchCabins();
  }, [fetchCabins]);

  const handleAddCabin = async () => {
    const targetFloor = addMode === 'single' ? Number(addFloor) : Number(bulkFloor);
    if (!targetFloor || targetFloor < 1) {
      toast.error('Please select a floor');
      return;
    }
    setSubmitting(true);
    try {
      const body =
        addMode === 'single'
          ? { action: 'add', cabinNum: singleCabinNum, floor: targetFloor }
          : { action: 'add-bulk', count: Number(bulkCount), floor: targetFloor };

      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Failed to add cabin(s)');
        return;
      }

      toast.success(
        addMode === 'single'
          ? `Cabin #${singleCabinNum} added on ${formatFloorLabel(targetFloor)}`
          : `${json.count} cabins added on ${formatFloorLabel(targetFloor)}`
      );
      setAddDialogOpen(false);
      setSingleCabinNum('');
      setBulkCount('');
      fetchCabins();
    } catch {
      toast.error('Failed to add cabin(s)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCabin = async () => {
    if (!selectedCabin) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: selectedCabin.id,
          status: editStatus,
          notes: editNotes,
          floor: editFloor ? Number(editFloor) : undefined,
          cabinNum: editCabinNum ? Number(editCabinNum) : undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Failed to update cabin');
        return;
      }

      toast.success('Cabin updated successfully');
      setEditDialogOpen(false);
      setSelectedCabin(null);
      fetchCabins();
    } catch {
      toast.error('Failed to update cabin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCabin = async () => {
    if (!selectedCabin) return;
    if (!confirm(`Delete Cabin #${selectedCabin.cabinNum} on ${formatFloorLabel(selectedCabin.floor)}? This cannot be undone.`)) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: selectedCabin.id }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Failed to delete cabin');
        return;
      }

      toast.success('Cabin deleted successfully');
      setEditDialogOpen(false);
      setSelectedCabin(null);
      fetchCabins();
    } catch {
      toast.error('Failed to delete cabin');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (cabin: Cabin) => {
    setSelectedCabin(cabin);
    setEditStatus(cabin.status);
    setEditNotes(cabin.notes || '');
    setEditFloor(String(cabin.floor));
    setEditCabinNum(String(cabin.cabinNum));
    setEditDialogOpen(true);
  };

  const handleDeleteFloor = async () => {
    if (!deleteFloorNum) return;
    const floorCabins = cabins.filter((c) => c.floor === deleteFloorNum);
    const hasActiveBookings = floorCabins.some((c) => c.bookings.length > 0);
    if (hasActiveBookings) {
      toast.error('Cannot delete floor with active bookings. Please cancel or move bookings first.');
      return;
    }
    setSubmitting(true);
    try {
      // Delete all cabins on the floor one by one
      for (const cabin of floorCabins) {
        await fetch('/api/cabins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: cabin.id }),
        });
      }
      toast.success(`${formatFloorLabel(deleteFloorNum)} deleted (${floorCabins.length} cabins removed)`);
      setDeleteFloorDialogOpen(false);
      setDeleteFloorNum(null);
      setDeleteFloorConfirm('');
      setActiveFloor('all');
      fetchCabins();
    } catch {
      toast.error('Failed to delete floor');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate cabin display states using operating hours
  const cabinStates = cabins.map((c) => ({
    cabin: c,
    state: getCabinDisplayState(c, opStart, opEnd),
  }));

  const availableCount = cabinStates.filter((c) => c.state === 'available').length;
  const reservedCount = cabinStates.filter((c) => c.state === 'reserved').length;
  const shiftCount = cabinStates.filter((c) => c.state === 'shift').length;
  const timeslotFullCount = cabinStates.filter((c) => c.state === 'timeslot-full').length;
  const inactiveCount = cabinStates.filter((c) => c.state === 'inactive').length;

  // Filter cabins by floor and status
  const floorFilteredCabins = activeFloor === 'all'
    ? cabinStates
    : cabinStates.filter((c) => c.cabin.floor === activeFloor);

  const filteredCabins = filterState === 'all'
    ? floorFilteredCabins
    : floorFilteredCabins.filter((c) => c.state === filterState);

  // Floor stats
  const floorStats = floors.map((f) => {
    const floorCabins = cabinStates.filter((c) => c.cabin.floor === f);
    return {
      floor: f,
      label: formatFloorLabel(f),
      total: floorCabins.length,
      available: floorCabins.filter((c) => c.state === 'available').length,
      occupied: floorCabins.filter((c) => c.state === 'reserved').length,
      hourly: floorCabins.filter((c) => c.state === 'shift' || c.state === 'timeslot-full').length,
      inactive: floorCabins.filter((c) => c.state === 'inactive').length,
    };
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
            ))}
          </div>
          <Skeleton className="h-10 w-32 rounded-lg shrink-0 ml-3" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const filterBadges: { key: FilterType; label: string; count: number; color: string; activeColor: string }[] = [
    { key: 'all', label: 'All', count: cabins.length, color: 'border-cyan-200 text-cyan-600 bg-cyan-50', activeColor: 'border-cyan-500 text-cyan-900 bg-cyan-200' },
    { key: 'available', label: 'Available', count: availableCount, color: 'border-emerald-200 text-emerald-700 bg-emerald-50', activeColor: 'border-emerald-500 text-emerald-900 bg-emerald-200' },
    { key: 'reserved', label: 'Reserved', count: reservedCount, color: 'border-red-200 text-red-700 bg-red-50', activeColor: 'border-red-500 text-red-900 bg-red-200' },
    { key: 'shift', label: 'Shift', count: shiftCount, color: 'border-sky-200 text-sky-700 bg-sky-50', activeColor: 'border-sky-500 text-sky-900 bg-sky-200' },
    ...(timeslotFullCount > 0 ? [{ key: 'timeslot-full' as FilterType, label: 'Fully Booked', count: timeslotFullCount, color: 'border-sky-200 text-sky-700 bg-sky-50', activeColor: 'border-sky-500 text-sky-900 bg-sky-200' }] : []),
    ...(inactiveCount > 0 ? [{ key: 'inactive' as FilterType, label: 'Inactive', count: inactiveCount, color: 'border-gray-200 text-gray-500 bg-gray-50', activeColor: 'border-gray-400 text-gray-700 bg-gray-200' }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Floor Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Layers className="h-4 w-4 text-gray-400 mr-1" />
        <button
          onClick={() => setActiveFloor('all')}
          className={cn(
            'px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer',
            activeFloor === 'all'
              ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50'
          )}
        >
          All Floors ({cabins.length})
        </button>
        {floorStats.map((fs) => (
          <div key={fs.floor} className="relative group">
            <button
              onClick={() => setActiveFloor(fs.floor)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer pr-8',
                activeFloor === fs.floor
                  ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50'
              )}
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {fs.label}
                <span className="text-xs opacity-70">({fs.total})</span>
              </span>
            </button>
            {activeFloor === fs.floor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteFloorNum(fs.floor);
                  setDeleteFloorConfirm('');
                  setDeleteFloorDialogOpen(true);
                }}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                title="Delete floor"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {/* Quick Add Floor Button */}
        <button
          onClick={() => {
            setAddMode('bulk');
            // Find next floor number not in use
            const usedFloors = new Set(floors);
            let nextFloor = 1;
            while (usedFloors.has(nextFloor)) nextFloor++;
            setBulkFloor(String(nextFloor));
            setBulkCount('');
            setAddDialogOpen(true);
          }}
          className="px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-400 hover:border-cyan-400 hover:text-cyan-500 hover:bg-cyan-50/50 transition-all cursor-pointer flex items-center gap-1.5"
          title="Add a new floor with cabins"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Floor
        </button>
      </div>

      {/* Floor Stats Cards (when a specific floor is selected) */}
      {activeFloor !== 'all' && (() => {
        const fs = floorStats.find((f) => f.floor === activeFloor);
        if (!fs) return null;
        const hasBookings = fs.occupied > 0 || fs.hourly > 0;
        return (
          <div className="flex items-start gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{fs.available}</p>
                <p className="text-xs text-emerald-600 font-medium">Available</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{fs.occupied}</p>
                <p className="text-xs text-red-600 font-medium">Exclusive</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 text-center">
                <p className="text-2xl font-bold text-sky-700">{fs.hourly}</p>
                <p className="text-xs text-sky-600 font-medium">Hourly</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-500">{fs.inactive}</p>
                <p className="text-xs text-gray-500 font-medium">Inactive</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0"
              onClick={() => {
                setDeleteFloorNum(fs.floor);
                setDeleteFloorConfirm('');
                setDeleteFloorDialogOpen(true);
              }}
              disabled={hasBookings}
              title={hasBookings ? 'Cannot delete floor with active bookings' : 'Delete this entire floor'}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove Floor
            </Button>
          </div>
        );
      })()}

      {/* Filter badges and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filterBadges.map((badge) => (
            <button
              key={badge.key}
              onClick={() => setFilterState(badge.key)}
              className={cn(
                'px-3 py-2 rounded-full border text-xs font-medium transition-all cursor-pointer',
                filterState === badge.key ? badge.activeColor : badge.color
              )}
            >
              {badge.label}: {badge.count}
            </button>
          ))}
          {filterState !== 'all' && (
            <button
              onClick={() => setFilterState('all')}
              className="text-sm text-gray-400 hover:text-cyan-600 self-center ml-1 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Cabin
        </Button>
      </div>

      {/* Cabin Grid — Grouped by Floor when showing all floors */}
      {activeFloor === 'all' ? (
        // Grouped by floor view
        <div className="space-y-6">
          {floors.map((floorNum) => {
            const floorCabins = filteredCabins.filter((c) => c.cabin.floor === floorNum);
            if (floorCabins.length === 0) return null;
            return (
              <div key={floorNum}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-cyan-600" />
                  <h3 className="text-sm font-semibold text-gray-700">{formatFloorLabel(floorNum)}</h3>
                  <Badge variant="outline" className="text-xs text-gray-500">{floorCabins.length} cabins</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {floorCabins.map(({ cabin, state }) => (
                    <CabinCard key={cabin.id} cabin={cabin} state={state} opStart={opStart} opEnd={opEnd} onClick={() => openEditDialog(cabin)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Single floor view
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredCabins.map(({ cabin, state }) => (
            <CabinCard key={cabin.id} cabin={cabin} state={state} opStart={opStart} opEnd={opEnd} onClick={() => openEditDialog(cabin)} />
          ))}
        </div>
      )}

      {filteredCabins.length === 0 && !loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-gray-400">
            <DoorOpen className="h-12 w-12 mx-auto mb-3 opacity-50 text-cyan-300" />
            <p>No cabins match the selected filter</p>
            <p className="text-sm mt-1">Try a different filter or add new cabins</p>
          </CardContent>
        </Card>
      )}

      {/* Add Cabin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-cyan-500" />
              Add Cabin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={addMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('single')}
                className={addMode === 'single' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                Single Cabin
              </Button>
              <Button
                variant={addMode === 'bulk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('bulk')}
                className={addMode === 'bulk' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                Bulk Add
              </Button>
            </div>

            {/* Floor selector for add */}
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select
                value={addMode === 'single' ? addFloor : bulkFloor}
                onValueChange={(val) => {
                  if (addMode === 'single') setAddFloor(val);
                  else setBulkFloor(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {/* Show existing floors with cabin counts */}
                  {floorStats.map((fs) => (
                    <SelectItem key={fs.floor} value={String(fs.floor)}>
                      {formatFloorLabel(fs.floor)} ({fs.total} cabins)
                    </SelectItem>
                  ))}
                  {/* Add new floor options (up to floor 10, excluding existing) */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    .filter((f) => !floors.includes(f))
                    .map((f) => (
                      <SelectItem key={f} value={String(f)}>
                        {formatFloorLabel(f)} (new)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {/* Show info about selected floor */}
              {(() => {
                const selectedF = Number(addMode === 'single' ? addFloor : bulkFloor);
                const isExisting = floors.includes(selectedF);
                const floorCabinCount = isExisting
                  ? cabins.filter((c) => c.floor === selectedF).length
                  : 0;
                const nextNum = isExisting
                  ? cabins.filter((c) => c.floor === selectedF).length > 0
                    ? Math.max(...cabins.filter((c) => c.floor === selectedF).map((c) => c.cabinNum)) + 1
                    : 1
                  : 1;
                if (!selectedF) return null;
                return (
                  <div className="rounded-lg bg-cyan-50 border border-cyan-100 p-2.5 text-xs space-y-1">
                    {isExisting ? (
                      <>
                        <p className="text-cyan-800 font-medium">
                          {formatFloorLabel(selectedF)} — {floorCabinCount} cabin{floorCabinCount !== 1 ? 's' : ''} existing
                        </p>
                        <p className="text-cyan-600">
                          Next available cabin number: #{nextNum}
                        </p>
                      </>
                    ) : (
                      <p className="text-cyan-800 font-medium">
                        {formatFloorLabel(selectedF)} — New floor, cabins will start from #1
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {addMode === 'single' ? (
              <div className="space-y-2">
                <Label htmlFor="cabinNum">Cabin Number</Label>
                <Input
                  id="cabinNum"
                  type="number"
                  placeholder="Enter cabin number"
                  value={singleCabinNum}
                  onChange={(e) => setSingleCabinNum(e.target.value)}
                  min={1}
                />
                <p className="text-xs text-gray-500">
                  Cabin will be added to {formatFloorLabel(Number(addMode === 'single' ? addFloor : bulkFloor))}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="bulkCount">Number of Cabins</Label>
                <Input
                  id="bulkCount"
                  type="number"
                  placeholder="e.g. 5"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  min={1}
                  max={50}
                />
                <p className="text-xs text-gray-500">
                  Cabins will be numbered automatically on {formatFloorLabel(Number(bulkFloor))} starting from the next available number.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCabin}
              disabled={submitting || (addMode === 'single' ? !singleCabinNum : !bulkCount)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cabin Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-cyan-500" />
              Edit Cabin #{selectedCabin?.cabinNum} — {selectedCabin ? formatFloorLabel(selectedCabin.floor) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Floor</Label>
                <Select value={editFloor} onValueChange={setEditFloor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => (
                      <SelectItem key={f} value={String(f)}>
                        {formatFloorLabel(f)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCabinNum">Cabin Number</Label>
                <Input
                  id="editCabinNum"
                  type="number"
                  value={editCabinNum}
                  onChange={(e) => setEditCabinNum(e.target.value)}
                  min={1}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            {selectedCabin && selectedCabin.bookings.length > 0 && (
              <div className="rounded-lg bg-cyan-50 p-3 space-y-2 border border-cyan-100">
                <p className="text-sm font-medium text-cyan-800">Active Bookings ({selectedCabin.bookings.length})</p>
                {selectedCabin.bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{b.student.name}</span>
                    <Badge variant="outline" className="text-xs">{b.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedCabin && selectedCabin.bookings.length === 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteCabin}
                disabled={submitting}
                className="sm:mr-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCabin}
                disabled={submitting}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Floor Confirmation Dialog */}
      <Dialog open={deleteFloorDialogOpen} onOpenChange={setDeleteFloorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="h-5 w-5" />
              Delete {deleteFloorNum ? formatFloorLabel(deleteFloorNum) : 'Floor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {deleteFloorNum && (() => {
              const floorCabins = cabins.filter((c) => c.floor === deleteFloorNum);
              const hasBookings = floorCabins.some((c) => c.bookings.length > 0);
              return (
                <>
                  <div className="rounded-lg bg-red-50 p-4 space-y-2 border border-red-100">
                    <p className="text-sm font-medium text-red-800">
                      This will permanently delete <strong>{floorCabins.length} cabin{floorCabins.length !== 1 ? 's' : ''}</strong> on {formatFloorLabel(deleteFloorNum)}.
                    </p>
                    {hasBookings && (
                      <p className="text-sm text-red-600">
                        Some cabins have active bookings and cannot be deleted. Please cancel or move those bookings first.
                      </p>
                    )}
                  </div>
                  {!hasBookings && (
                    <>
                      <p className="text-sm text-gray-600">
                        Type <strong>{formatFloorLabel(deleteFloorNum)}</strong> to confirm deletion:
                      </p>
                      <Input
                        placeholder={formatFloorLabel(deleteFloorNum)}
                        value={deleteFloorConfirm}
                        onChange={(e) => setDeleteFloorConfirm(e.target.value)}
                      />
                    </>
                  )}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFloorDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFloor}
              disabled={submitting || !deleteFloorNum || deleteFloorConfirm !== (deleteFloorNum ? formatFloorLabel(deleteFloorNum) : '')}
            >
              {submitting ? 'Deleting...' : 'Delete Floor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted CabinCard component
function CabinCard({ cabin, state, opStart, opEnd, onClick }: {
  cabin: Cabin;
  state: CabinDisplayState;
  opStart: string;
  opEnd: string;
  onClick: () => void;
}) {
  const styles = getDisplayStyles(state);
  const reservedBooking = cabin.bookings.find((b) => b.type === 'reserved' && b.status === 'active');
  const shiftBookings = cabin.bookings.filter((b) => b.type === 'shift' && b.status === 'active');

  return (
    <Card
      className={`cursor-pointer border-2 rounded-xl transition-all duration-200 ${styles}`}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/80">
              <DoorOpen className="h-4 w-4 text-cyan-600" />
            </div>
            <span className="font-bold text-gray-900 text-lg">#{cabin.cabinNum}</span>
          </div>
          {getStatusBadge(state)}
        </div>
        {/* Floor label */}
        <p className="text-[11px] text-gray-400 font-medium mb-1 flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {formatFloorLabel(cabin.floor)}
        </p>
        {state === 'reserved' && reservedBooking && (
          <div className="mt-2 text-xs">
            <p className="font-medium text-red-800 truncate">{reservedBooking.student.name}</p>
            <p className="text-gray-500 truncate">{reservedBooking.student.phone}</p>
          </div>
        )}
        {state === 'shift' && shiftBookings.length > 0 && (
          <div className="mt-2 text-xs space-y-0.5">
            {shiftBookings.map((b) => {
              let shiftName = 'Morning Shift';
              if (b.startTime === '10:00') shiftName = 'Day Shift';
              else if (b.startTime === '17:00') shiftName = 'Night Shift';
              return (
                <div key={b.id} className="text-sky-800 truncate">
                  <span className="font-medium">{shiftName}</span>: {b.student.name}
                </div>
              );
            })}
          </div>
        )}
        {state === 'timeslot-full' && shiftBookings.length > 0 && (
          <div className="mt-2 text-xs space-y-0.5">
            <p className="font-semibold text-sky-800">Fully Booked (3 Shifts)</p>
            {shiftBookings.map((b) => {
              let shiftName = 'Morning Shift';
              if (b.startTime === '10:00') shiftName = 'Day Shift';
              else if (b.startTime === '17:00') shiftName = 'Night Shift';
              return (
                <div key={b.id} className="text-gray-500 truncate">
                  {shiftName}: {b.student.name}
                </div>
              );
            })}
          </div>
        )}
        {state === 'inactive' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <Wrench className="h-3 w-3" />
            <span>{cabin.status}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
