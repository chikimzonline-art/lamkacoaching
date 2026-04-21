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
import { Plus, DoorOpen, Wrench, X } from 'lucide-react';
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
  cabinNum: number;
  status: string;
  notes: string | null;
  bookings: CabinBooking[];
}

type CabinDisplayState = 'available' | 'exclusive' | 'hourly' | 'timeslot-full' | 'inactive';
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

// Check if the merged hourly bookings fully cover the operating hours
function isTimeslotFullyCovered(
  hourlyBookings: { startTime: string; endTime: string }[],
  opStart: string,
  opEnd: string
): boolean {
  if (hourlyBookings.length === 0) return false;
  const opStartMin = timeToMinutes(opStart);
  const opEndMin = timeToMinutes(opEnd);
  const merged = mergeTimeSlots(hourlyBookings);

  if (merged.length === 0) return false;
  return merged[0].start <= opStartMin && merged[merged.length - 1].end >= opEndMin;
}

function getCabinDisplayState(
  cabin: Cabin,
  opStart: string,
  opEnd: string
): CabinDisplayState {
  if (cabin.status === 'inactive' || cabin.status === 'maintenance') return 'inactive';
  const exclusiveBooking = cabin.bookings.find((b) => b.type === 'exclusive' && b.status === 'active');
  if (exclusiveBooking) return 'exclusive';

  const hourlyBookings = cabin.bookings.filter((b) => b.type === 'hourly' && b.status === 'active');
  if (hourlyBookings.length === 0) return 'available';

  if (isTimeslotFullyCovered(hourlyBookings, opStart, opEnd)) return 'timeslot-full';

  return 'hourly';
}

function getDisplayStyles(state: CabinDisplayState) {
  switch (state) {
    case 'available':
      return 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-400';
    case 'exclusive':
      return 'border-red-300 bg-red-50/50 hover:border-red-400';
    case 'hourly':
      return 'border-sky-300 bg-sky-50/50 hover:border-sky-400';
    case 'timeslot-full':
      return 'border-amber-300 bg-amber-50/50 hover:border-amber-400';
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
    case 'exclusive':
      return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Exclusive</Badge>;
    case 'hourly':
      return <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs">Hourly</Badge>;
    case 'timeslot-full':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Fully Booked</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">Inactive</Badge>;
    default:
      return null;
  }
}

export default function CabinsView() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<FilterType>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [singleCabinNum, setSingleCabinNum] = useState('');
  const [bulkCount, setBulkCount] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
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
    } catch (err) {
      console.error('Failed to fetch cabins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchCabins();
  }, [fetchCabins]);

  const handleAddCabin = async () => {
    setSubmitting(true);
    try {
      const body =
        addMode === 'single'
          ? { action: 'add', cabinNum: singleCabinNum }
          : { action: 'add-bulk', count: Number(bulkCount) };

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
          ? `Cabin #${singleCabinNum} added successfully`
          : `${json.count} cabins added successfully`
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
    if (!confirm(`Delete Cabin #${selectedCabin.cabinNum}? This cannot be undone.`)) return;
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
    setEditDialogOpen(true);
  };

  // Calculate cabin display states using operating hours
  const cabinStates = cabins.map((c) => ({
    cabin: c,
    state: getCabinDisplayState(c, opStart, opEnd),
  }));

  const availableCount = cabinStates.filter((c) => c.state === 'available').length;
  const exclusiveCount = cabinStates.filter((c) => c.state === 'exclusive').length;
  const hourlyCount = cabinStates.filter((c) => c.state === 'hourly').length;
  const timeslotFullCount = cabinStates.filter((c) => c.state === 'timeslot-full').length;
  const inactiveCount = cabinStates.filter((c) => c.state === 'inactive').length;

  // Filter cabins
  const filteredCabins = filterState === 'all'
    ? cabinStates
    : cabinStates.filter((c) => c.state === filterState);

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
    { key: 'all', label: 'All', count: cabins.length, color: 'border-orange-200 text-orange-600 bg-orange-50', activeColor: 'border-orange-500 text-orange-900 bg-orange-200' },
    { key: 'available', label: 'Available', count: availableCount, color: 'border-emerald-200 text-emerald-700 bg-emerald-50', activeColor: 'border-emerald-500 text-emerald-900 bg-emerald-200' },
    { key: 'exclusive', label: 'Exclusive', count: exclusiveCount, color: 'border-red-200 text-red-700 bg-red-50', activeColor: 'border-red-500 text-red-900 bg-red-200' },
    { key: 'hourly', label: 'Hourly', count: hourlyCount, color: 'border-sky-200 text-sky-700 bg-sky-50', activeColor: 'border-sky-500 text-sky-900 bg-sky-200' },
    ...(timeslotFullCount > 0 ? [{ key: 'timeslot-full' as FilterType, label: 'Fully Booked', count: timeslotFullCount, color: 'border-amber-200 text-amber-700 bg-amber-50', activeColor: 'border-amber-500 text-amber-900 bg-amber-200' }] : []),
    ...(inactiveCount > 0 ? [{ key: 'inactive' as FilterType, label: 'Inactive', count: inactiveCount, color: 'border-gray-200 text-gray-500 bg-gray-50', activeColor: 'border-gray-400 text-gray-700 bg-gray-200' }] : []),
  ];

  return (
    <div className="space-y-4">
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
              className="text-sm text-gray-400 hover:text-orange-600 self-center ml-1 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Cabin
        </Button>
      </div>

      {/* Cabin Grid - 2 cols mobile, 3 sm, 4 md, 5 lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredCabins.map(({ cabin, state }) => {
          const styles = getDisplayStyles(state);
          const exclusiveBooking = cabin.bookings.find((b) => b.type === 'exclusive' && b.status === 'active');
          const hourlyBooking = cabin.bookings.find((b) => b.type === 'hourly' && b.status === 'active');
          const hourlyBookings = cabin.bookings.filter((b) => b.type === 'hourly' && b.status === 'active');

          return (
            <Card
              key={cabin.id}
              className={`cursor-pointer border-2 rounded-xl transition-all duration-200 ${styles}`}
              onClick={() => openEditDialog(cabin)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/80">
                      <DoorOpen className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg">#{cabin.cabinNum}</span>
                  </div>
                  {getStatusBadge(state)}
                </div>
                {state === 'exclusive' && exclusiveBooking && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium text-red-800 truncate">{exclusiveBooking.student.name}</p>
                    <p className="text-gray-500 truncate">{exclusiveBooking.student.phone}</p>
                  </div>
                )}
                {state === 'hourly' && hourlyBooking && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium text-sky-800 truncate">{hourlyBooking.student.name}</p>
                    <p className="text-gray-500">
                      {formatTime(hourlyBooking.startTime || '')} - {formatTime(hourlyBooking.endTime || '')}
                    </p>
                  </div>
                )}
                {state === 'timeslot-full' && hourlyBookings.length > 0 && (
                  <div className="mt-2 text-xs space-y-0.5">
                    <p className="font-medium text-amber-800">{hourlyBookings.length} booking{hourlyBookings.length > 1 ? 's' : ''}</p>
                    <p className="text-gray-500">
                      {formatTime(opStart)} - {formatTime(opEnd)} covered
                    </p>
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
        })}
      </div>

      {filteredCabins.length === 0 && !loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-gray-400">
            <DoorOpen className="h-12 w-12 mx-auto mb-3 opacity-50 text-orange-300" />
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
              <DoorOpen className="h-5 w-5 text-orange-500" />
              Add Cabin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={addMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('single')}
                className={addMode === 'single' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Single Cabin
              </Button>
              <Button
                variant={addMode === 'bulk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('bulk')}
                className={addMode === 'bulk' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Bulk Add
              </Button>
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
                  Cabins will be numbered automatically starting from the next available number.
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
              className="bg-orange-500 hover:bg-orange-600 text-white"
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
              <DoorOpen className="h-5 w-5 text-orange-500" />
              Edit Cabin #{selectedCabin?.cabinNum}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
              <div className="rounded-lg bg-orange-50 p-3 space-y-2 border border-orange-100">
                <p className="text-sm font-medium text-orange-800">Active Bookings ({selectedCabin.bookings.length})</p>
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
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
