'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DoorOpen,
  Plus,
  Wrench,
  Trash2,
  AlertTriangle,
  Building2,
  QrCode,
  Search,
  Edit2,
  CheckCircle2,
  Filter,
  RefreshCw,
  Layers,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const AdminQrGeneratorDialog = dynamic(() => import('./admin-qr-generator-dialog'), { ssr: false });

interface CabinBooking {
  id: string;
  type: string;
  status: string;
  student: { id: string; name: string; phone: string };
  startDate: string;
  endDate: string | null;
}

interface Cabin {
  id: string;
  floor: number;
  cabinNum: number;
  status: string;
  notes: string | null;
  bookings: CabinBooking[];
}

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

export default function CabinAssetManagement() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');

  // Add Cabin Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [singleCabinNum, setSingleCabinNum] = useState('');
  const [addFloor, setAddFloor] = useState<string>('');
  const [bulkCount, setBulkCount] = useState('');
  const [bulkFloor, setBulkFloor] = useState<string>('');
  const [addNotes, setAddNotes] = useState('');
  const [addStatus, setAddStatus] = useState('active');

  // Edit Cabin Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [editFloor, setEditFloor] = useState('');
  const [editCabinNum, setEditCabinNum] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 2-Step Delete Cabin states
  const [deleteCabinDialogOpen, setDeleteCabinDialogOpen] = useState(false);
  const [deleteCabinStep, setDeleteCabinStep] = useState<1 | 2>(1);
  const [deleteCabinInput, setDeleteCabinInput] = useState('');
  const [cabinToDelete, setCabinToDelete] = useState<Cabin | null>(null);

  // Delete Floor states
  const [deleteFloorDialogOpen, setDeleteFloorDialogOpen] = useState(false);
  const [deleteFloorNum, setDeleteFloorNum] = useState<number | null>(null);
  const [deleteFloorConfirm, setDeleteFloorConfirm] = useState('');

  // QR Sticker Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchCabins = useCallback(async () => {
    try {
      const res = await fetch('/api/cabins');
      const json = await res.json();
      if (json.cabins) setCabins(json.cabins);
      if (json.floors) setFloors(json.floors);
    } catch (err) {
      console.error('Failed to fetch cabins:', err);
      toast.error('Failed to load cabins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCabins();
  }, [fetchCabins]);

  useEffect(() => {
    if (floors.length > 0) {
      const lowestFloor = floors[0];
      if (!addFloor) setAddFloor(String(lowestFloor));
      if (!bulkFloor) setBulkFloor(String(lowestFloor));
    }
  }, [floors, addFloor, bulkFloor]);

  // Handle Add Single Cabin
  const handleAddSingle = async () => {
    if (!singleCabinNum) {
      toast.error('Please enter a cabin number');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          cabinNum: parseInt(singleCabinNum),
          floor: parseInt(addFloor) || 3,
          notes: addNotes.trim() || undefined,
          status: addStatus,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to create cabin');
        return;
      }
      toast.success(`Cabin #${singleCabinNum} created on ${formatFloorLabel(parseInt(addFloor) || 3)}`);
      setAddDialogOpen(false);
      setSingleCabinNum('');
      setAddNotes('');
      fetchCabins();
    } catch {
      toast.error('Failed to create cabin');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bulk Add Cabins
  const handleAddBulk = async () => {
    const count = parseInt(bulkCount);
    if (!count || count < 1 || count > 50) {
      toast.error('Please enter a number between 1 and 50');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-bulk',
          count,
          floor: parseInt(bulkFloor) || 3,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to bulk create cabins');
        return;
      }
      toast.success(`Successfully created ${count} cabins on ${formatFloorLabel(parseInt(bulkFloor) || 3)}`);
      setAddDialogOpen(false);
      setBulkCount('');
      fetchCabins();
    } catch {
      toast.error('Failed to bulk create cabins');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Dialog
  const openEdit = (cabin: Cabin) => {
    setSelectedCabin(cabin);
    setEditFloor(String(cabin.floor));
    setEditCabinNum(String(cabin.cabinNum));
    setEditStatus(cabin.status);
    setEditNotes(cabin.notes || '');
    setEditDialogOpen(true);
  };

  // Handle Save Edit
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
          floor: isAdmin ? parseInt(editFloor) : undefined,
          cabinNum: isAdmin ? parseInt(editCabinNum) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to update cabin');
        return;
      }
      toast.success(`Cabin #${selectedCabin.cabinNum} updated`);
      setEditDialogOpen(false);
      fetchCabins();
    } catch {
      toast.error('Failed to update cabin');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick toggle status directly in table/card
  const handleQuickStatusChange = async (cabin: Cabin, newStatus: string) => {
    try {
      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: cabin.id,
          status: newStatus,
        }),
      });
      if (!res.ok) {
        toast.error('Failed to update status');
        return;
      }
      toast.success(`Cabin #${cabin.cabinNum} set to ${newStatus}`);
      fetchCabins();
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Handle 2-Step Permanent Delete Cabin
  const executeDeleteCabin = async () => {
    if (!cabinToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: cabinToDelete.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to delete cabin');
        return;
      }
      toast.success(`Cabin #${cabinToDelete.cabinNum} permanently deleted`);
      setDeleteCabinDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedCabin(null);
      setCabinToDelete(null);
      setDeleteCabinInput('');
      fetchCabins();
    } catch {
      toast.error('Failed to delete cabin');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Floor
  const handleDeleteFloor = async () => {
    if (!deleteFloorNum || !isAdmin) return;
    const floorCabins = cabins.filter((c) => c.floor === deleteFloorNum);
    const hasActiveBookings = floorCabins.some((c) => c.bookings.length > 0);
    if (hasActiveBookings) {
      toast.error('Cannot delete floor with active bookings. Please move or cancel bookings first.');
      return;
    }
    setSubmitting(true);
    try {
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
      if (activeFloor === deleteFloorNum) setActiveFloor('all');
      fetchCabins();
    } catch {
      toast.error('Failed to delete floor');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered cabins
  const filteredCabins = cabins.filter((c) => {
    if (activeFloor !== 'all' && c.floor !== activeFloor) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNum = String(c.cabinNum).includes(q);
      const matchNotes = c.notes?.toLowerCase().includes(q);
      return matchNum || matchNotes;
    }
    return true;
  });

  const totalCabins = cabins.length;
  const activeCount = cabins.filter((c) => c.status === 'active').length;
  const maintenanceCount = cabins.filter((c) => c.status === 'maintenance').length;
  const inactiveCount = cabins.filter((c) => c.status === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-slate-200/90 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total Cabins</span>
              <DoorOpen className="h-4 w-4 text-cyan-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalCabins}</p>
            <p className="text-[11px] text-slate-400">Across {floors.length} floors</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/90 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Active Desks</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-[11px] text-slate-400">Operational & ready</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/90 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Maintenance</span>
              <Wrench className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{maintenanceCount}</p>
            <p className="text-[11px] text-slate-400">Under physical repair</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/90 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Inactive</span>
              <AlertTriangle className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-600">{inactiveCount}</p>
            <p className="text-[11px] text-slate-400">Decommissioned desks</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: Search, Filters & Setup Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search cabin # or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              className="border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 bg-white h-9 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5 text-purple-600" />
              <span>Print QR Stickers</span>
            </Button>

            {isAdmin && (
              <Button
                onClick={() => {
                  setAddMode('single');
                  setAddDialogOpen(true);
                }}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs h-9 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Add Cabin</span>
              </Button>
            )}

            {isAdmin && activeFloor !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteFloorNum(activeFloor);
                  setDeleteFloorConfirm('');
                  setDeleteFloorDialogOpen(true);
                }}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-9 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete {formatFloorLabel(activeFloor)}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Floor Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Floors:
            </span>
            <button
              onClick={() => setActiveFloor('all')}
              className={cn(
                'px-3 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                activeFloor === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              All Floors ({cabins.length})
            </button>
            {floors.map((floorNum) => {
              const floorCabins = cabins.filter((c) => c.floor === floorNum);
              const isActive = activeFloor === floorNum;
              return (
                <button
                  key={floorNum}
                  onClick={() => setActiveFloor(floorNum)}
                  className={cn(
                    'px-3 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                    isActive
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <Building2 className="h-3 w-3" />
                  <span>{formatFloorLabel(floorNum)}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {floorCabins.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'maintenance', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs capitalize transition-colors cursor-pointer',
                  statusFilter === s
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-500 hover:bg-slate-100 font-medium'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Grid / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Showing {filteredCabins.length} cabin desks</span>
          <span>Click "Edit" to modify floor, cabin number, or notes</span>
        </div>

        {filteredCabins.length === 0 ? (
          <Card className="border border-dashed border-slate-200">
            <CardContent className="p-8 text-center text-slate-400 space-y-2">
              <DoorOpen className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
              <p className="font-semibold text-slate-600">No cabins match current criteria</p>
              <p className="text-xs">Try resetting the search or filter settings.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCabins.map((cabin) => {
              const activeBookings = cabin.bookings?.filter(
                (b) => b.status === 'active' || b.status === 'pending_payment'
              ) || [];

              return (
                <div
                  key={cabin.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center font-bold text-cyan-800 text-sm">
                        #{cabin.cabinNum}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {formatFloorLabel(cabin.floor)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {activeBookings.length > 0
                            ? `${activeBookings.length} active shift(s)`
                            : 'No active bookings'}
                        </p>
                      </div>
                    </div>

                    <Select
                      value={cabin.status}
                      onValueChange={(val) => handleQuickStatusChange(cabin, val)}
                    >
                      <SelectTrigger className="h-7 text-[11px] px-2 w-28 bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {cabin.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 italic border border-slate-100">
                      "{cabin.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {cabin.id.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(cabin)}
                        className="h-7 px-2 text-cyan-700 hover:bg-cyan-50 text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Cabin Dialog (Single / Bulk) */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <DoorOpen className="h-5 w-5 text-cyan-600" />
              Add Cabin Desk
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add a new cabin desk individually or generate in bulk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={addMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('single')}
                className={addMode === 'single' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
              >
                Single Cabin
              </Button>
              <Button
                variant={addMode === 'bulk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('bulk')}
                className={addMode === 'bulk' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
              >
                Bulk Generate
              </Button>
            </div>

            {addMode === 'single' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Floor</Label>
                  <Select value={addFloor} onValueChange={setAddFloor}>
                    <SelectTrigger className="h-9 text-xs">
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Cabin Number *</Label>
                  <Input
                    type="number"
                    value={singleCabinNum}
                    onChange={(e) => setSingleCabinNum(e.target.value)}
                    placeholder="e.g. 15"
                    className="h-9 text-xs"
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Initial Status</Label>
                  <Select value={addStatus} onValueChange={setAddStatus}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Optional details, desk location..."
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Floor</Label>
                  <Select value={bulkFloor} onValueChange={setBulkFloor}>
                    <SelectTrigger className="h-9 text-xs">
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Number of Cabins to Generate *</Label>
                  <Input
                    type="number"
                    value={bulkCount}
                    onChange={(e) => setBulkCount(e.target.value)}
                    placeholder="e.g. 10 (auto-increments after highest cabin # on floor)"
                    min={1}
                    max={50}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Cabins will be automatically numbered consecutively on the selected floor.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} className="text-xs h-9">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={addMode === 'single' ? handleAddSingle : handleAddBulk}
              disabled={submitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold h-9 px-4 rounded-xl cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Cabins'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cabin Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <DoorOpen className="h-5 w-5 text-cyan-600" />
              Edit Cabin #{selectedCabin?.cabinNum} — {selectedCabin ? formatFloorLabel(selectedCabin.floor) : ''}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Modify cabin desk properties, floor assignment, and notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Floor</Label>
                <Select value={editFloor} onValueChange={setEditFloor} disabled={!isAdmin}>
                  <SelectTrigger className="h-9 text-xs">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Cabin Number</Label>
                <Input
                  type="number"
                  value={editCabinNum}
                  onChange={(e) => setEditCabinNum(e.target.value)}
                  min={1}
                  disabled={!isAdmin}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Notes</Label>
              <Textarea
                placeholder="Optional notes or repair description..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedCabin && selectedCabin.status === 'inactive' && isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setCabinToDelete(selectedCabin);
                  setDeleteCabinStep(1);
                  setDeleteCabinInput('');
                  setDeleteCabinDialogOpen(true);
                }}
                disabled={submitting}
                className="text-xs h-9 sm:mr-auto cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Permanently Delete
              </Button>
            )}

            <div className="flex items-center gap-2 sm:ml-auto">
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateCabin}
                disabled={submitting}
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold h-9 px-4 rounded-xl cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2-Step Permanent Delete Cabin Dialog */}
      <Dialog open={deleteCabinDialogOpen} onOpenChange={setDeleteCabinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {deleteCabinStep === 1 ? 'Permanently Delete Cabin?' : 'Confirm Permanent Deletion'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Permanently delete this cabin desk
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {deleteCabinStep === 1 ? (
              <>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete <strong className="text-slate-900">Cabin #{cabinToDelete?.cabinNum}</strong> on{' '}
                  <strong className="text-slate-900">{cabinToDelete ? formatFloorLabel(cabinToDelete.floor) : ''}</strong>?
                </p>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
                  <p className="font-semibold">⚠️ This action cannot be undone.</p>
                  <p>Deleting a cabin removes it permanently from the database. Cabins with active bookings cannot be deleted.</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  To confirm, please type <strong className="text-red-700 font-mono">DELETE</strong> in the box below:
                </p>
                <Input
                  value={deleteCabinInput}
                  onChange={(e) => setDeleteCabinInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="font-mono text-center tracking-widest uppercase text-sm h-10 border-red-300"
                  autoFocus
                />
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteCabinDialogOpen(false);
                setCabinToDelete(null);
              }}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            {deleteCabinStep === 1 ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteCabinStep(2)}
                className="text-xs h-9 font-semibold"
              >
                Continue to Verification
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={executeDeleteCabin}
                disabled={deleteCabinInput !== 'DELETE' || submitting}
                className="text-xs h-9 font-semibold"
              >
                {submitting ? 'Deleting...' : 'I Understand, Delete Cabin'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Floor Dialog */}
      <Dialog open={deleteFloorDialogOpen} onOpenChange={setDeleteFloorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete {deleteFloorNum ? formatFloorLabel(deleteFloorNum) : 'Floor'}?
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirm deletion of all cabins on this floor
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3 text-sm text-slate-600">
            <p>
              This will permanently delete all cabins on{' '}
              <strong className="text-slate-900">{deleteFloorNum ? formatFloorLabel(deleteFloorNum) : ''}</strong>.
            </p>
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 space-y-1">
              <p className="font-semibold">⚠️ Strict Safeguard:</p>
              <p>Floors with active bookings cannot be deleted.</p>
            </div>
            <p className="text-xs text-slate-500">
              To proceed, type <strong className="font-mono text-slate-800">DELETE FLOOR</strong> below:
            </p>
            <Input
              value={deleteFloorConfirm}
              onChange={(e) => setDeleteFloorConfirm(e.target.value)}
              placeholder="Type DELETE FLOOR"
              className="font-mono text-center tracking-widest text-xs h-9"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteFloorDialogOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteFloor}
              disabled={deleteFloorConfirm !== 'DELETE FLOOR' || submitting}
              className="text-xs h-9 font-semibold"
            >
              {submitting ? 'Deleting...' : 'Delete Floor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Sticker Modal */}
      <AdminQrGeneratorDialog
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        cabins={cabins}
      />
    </div>
  );
}
