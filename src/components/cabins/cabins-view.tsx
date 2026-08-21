'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDebouncedSearch } from '@/lib/hooks/use-debounced-search';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Plus, DoorOpen, Wrench, X, Building2, Layers, Trash2, AlertTriangle, CalendarPlus, UserPlus, Check, ChevronsUpDown, Search, Key, Copy, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { formatTime, formatCurrency } from '@/lib/helpers';
import { generateSecurePassword } from '@/lib/email';
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

type CabinDisplayState = 'available' | 'reserved' | 'partially_booked' | 'fully_booked' | 'inactive';
type FilterType = 'all' | CabinDisplayState;

function getCabinDisplayState(
  cabin: Cabin
): CabinDisplayState {
  if (cabin.status === 'inactive' || cabin.status === 'maintenance') return 'inactive';
  const reservedBooking = cabin.bookings.find((b) => b.type === 'reserved' && b.status === 'active');
  if (reservedBooking) return 'reserved';

  const shifts = new Set(cabin.bookings.filter((b) => b.status === 'active' && ['morning_shift', 'day_shift', 'night_shift'].includes(b.type)).map(b => b.type));
  
  if (shifts.size === 0) return 'available';
  if (shifts.size >= 3) return 'fully_booked'; // Assuming morning, day, night are the 3 main shifts
  return 'partially_booked';
}

function getDisplayStyles(state: CabinDisplayState) {
  switch (state) {
    case 'available':
      return 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-400';
    case 'reserved':
      return 'border-red-300 bg-red-50/50 hover:border-red-400';
    case 'partially_booked':
      return 'border-sky-300 bg-sky-50/50 hover:border-sky-400';
    case 'fully_booked':
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
    case 'partially_booked':
      return <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs">Partially Booked</Badge>;
    case 'fully_booked':
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
  
  // Cabin Search state
  const [cabinSearch, setCabinSearch] = useState('');

  // Quick Book state
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [bookStudentId, setBookStudentId] = useState('');
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentAddress, setNewStudentAddress] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');
  const [credentialsBanner, setCredentialsBanner] = useState<{
    name: string;
    username: string;
    phone: string;
    password: string;
    emailSent: boolean;
  } | null>(null);
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [bookType, setBookType] = useState('morning_shift');
  const [bookStartDate, setBookStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bookEndDate, setBookEndDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  });
  const [bookTotalAmount, setBookTotalAmount] = useState('');
  
  const [bookPayNow, setBookPayNow] = useState(false);
  const [bookPayAmount, setBookPayAmount] = useState('');
  const [bookPaymentDate, setBookPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bookPayMode, setBookPayMode] = useState<'cash' | 'upi'>('cash');
  const [bookReceiptNo, setBookReceiptNo] = useState('');
  
  const [rates, setRates] = useState({
    morning: 500,
    day: 800,
    night: 800,
    reserved: 1100,
    registration: 500,
  });

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
        setRates({
          morning: Number(json.settings.cabin_morning_shift_rate) || 500,
          day: Number(json.settings.cabin_day_shift_rate) || 800,
          night: Number(json.settings.cabin_night_shift_rate) || 800,
          reserved: Number(json.settings.cabin_reserved_rate) || 1100,
          registration: Number(json.settings.cabin_registration_fee) || 500,
        });
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

  const fetchStudentOptionsFn = useCallback(async (query: string, signal: AbortSignal) => {
    if (!bookDialogOpen) return { students: [] };
    const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`, { signal });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  }, [bookDialogOpen]);

  const {
    query: bookStudentSearch,
    setQuery: setBookStudentSearch,
    results: studentSearchRes,
    setResults: setStudentSearchRes,
    loading: studentSearchLoading
  } = useDebouncedSearch<{ students: {id:string; name:string; phone:string}[] }>(fetchStudentOptionsFn, 300, 2);

  const bookStudentOptions = studentSearchRes?.students || [];

  // Auto-calculate amount when type changes
  useEffect(() => {
    if (bookType === 'reserved') setBookTotalAmount(String(rates.reserved));
    else if (bookType === 'morning_shift') setBookTotalAmount(String(rates.morning));
    else if (bookType === 'day_shift') setBookTotalAmount(String(rates.day));
    else if (bookType === 'night_shift') setBookTotalAmount(String(rates.night));
  }, [bookType, rates]);

  // Keep payment amount in sync with total when payNow is toggled
  useEffect(() => {
    if (bookPayNow) {
      const baseAmount = Number(bookTotalAmount) || 0;
      const regFee = showNewStudentForm ? rates.registration : 0;
      setBookPayAmount(String(baseAmount + regFee));
      setBookPaymentDate(bookStartDate);
    }
  }, [bookPayNow, bookTotalAmount, showNewStudentForm, rates.registration, bookStartDate]);

  const handleCreateInlineStudent = async () => {
    if (!newStudentName.trim() || !newStudentPhone.trim() || !newStudentEmail.trim()) {
      toast.error('Please enter student name, phone, and email');
      return null;
    }
    setCreatingStudent(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newStudentName.trim(),
          phone: newStudentPhone.trim(),
          email: newStudentEmail.trim(),
          username: newStudentUsername.trim() || undefined,
          password: newStudentPassword.trim() || undefined,
          address: newStudentAddress.trim() || undefined,
          notes: newStudentNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to create student');
        return null;
      }

      setCredentialsBanner({
        name: json.student.name,
        username: json.student.username || json.student.phone,
        phone: json.student.phone,
        password: json.generatedPassword,
        emailSent: json.emailSent,
      });

      if (json.emailSent) {
        toast.success(`Student created & login credentials sent to ${json.student.email}!`);
      } else {
        toast.success(`Student created! Generated password: ${json.generatedPassword}`);
      }

      setStudentSearchRes({ students: [json.student] });
      return json.student.id;
    } catch {
      toast.error('Failed to create student');
      return null;
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleQuickBook = async () => {
    let finalStudentId = bookStudentId;

    if (showNewStudentForm) {
      const newId = await handleCreateInlineStudent();
      if (!newId) return;
      finalStudentId = newId;
    }

    if (!selectedCabin || !finalStudentId || !bookType || !bookStartDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Calculate total amount
    const baseAmount = Number(bookTotalAmount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      toast.error('Please enter a valid monthly fee amount');
      return;
    }
    
    // Add registration fee if a new student is being created
    const finalTotalAmount = baseAmount + (showNewStudentForm ? rates.registration : 0);

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        action: 'create',
        studentId: finalStudentId,
        cabinId: selectedCabin.id,
        type: bookType,
        startDate: bookStartDate,
        endDate: bookType !== 'reserved' ? bookEndDate : null,
        totalAmount: finalTotalAmount,
      };

      if (bookPayNow && bookPayAmount) {
        body.payNow = true;
        body.payAmount = Number(bookPayAmount);
        body.payMode = bookPayMode;
        body.paymentDate = bookPaymentDate;
        body.receiptNo = bookReceiptNo || undefined;
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

      toast.success('Booking created successfully');
      setBookDialogOpen(false);
      setEditDialogOpen(false);
      setBookStudentId('');
      setBookStudentSearch('');
      setShowNewStudentForm(false);
      setNewStudentName('');
      setNewStudentPhone('');
      setNewStudentEmail('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setNewStudentAddress('');
      setNewStudentNotes('');
      setBookPayNow(false);
      setBookPayAmount('');
      setBookReceiptNo('');
      setBookTotalAmount('');
      fetchCabins();
    } catch {
      toast.error('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

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

  // Calculate cabin display states
  const cabinStates = cabins.map((c) => ({
    cabin: c,
    state: getCabinDisplayState(c),
  }));

  const availableCount = cabinStates.filter((c) => c.state === 'available').length;
  const reservedCount = cabinStates.filter((c) => c.state === 'reserved').length;
  const partiallyBookedCount = cabinStates.filter((c) => c.state === 'partially_booked').length;
  const fullyBookedCount = cabinStates.filter((c) => c.state === 'fully_booked').length;
  const inactiveCount = cabinStates.filter((c) => c.state === 'inactive').length;

  // Filter cabins by floor and status
  const floorFilteredCabins = activeFloor === 'all'
    ? cabinStates
    : cabinStates.filter((c) => c.cabin.floor === activeFloor);

  const statusFilteredCabins = filterState === 'all'
    ? floorFilteredCabins
    : floorFilteredCabins.filter((c) => c.state === filterState);

  const cleanCabinSearch = cabinSearch.replace(/[#\s]/g, '').toLowerCase();
  const filteredCabins = cleanCabinSearch
    ? statusFilteredCabins.filter((c) => String(c.cabin.cabinNum).includes(cleanCabinSearch))
    : statusFilteredCabins;

  // Floor stats
  const floorStats = floors.map((f) => {
    const floorCabins = cabinStates.filter((c) => c.cabin.floor === f);
    return {
      floor: f,
      label: formatFloorLabel(f),
      total: floorCabins.length,
      available: floorCabins.filter((c) => c.state === 'available').length,
      occupied: floorCabins.filter((c) => c.state === 'reserved').length,
      shifts: floorCabins.filter((c) => c.state === 'partially_booked' || c.state === 'fully_booked').length,
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
    { key: 'partially_booked', label: 'Partially Booked', count: partiallyBookedCount, color: 'border-sky-200 text-sky-700 bg-sky-50', activeColor: 'border-sky-500 text-sky-900 bg-sky-200' },
    ...(fullyBookedCount > 0 ? [{ key: 'fully_booked' as FilterType, label: 'Fully Booked', count: fullyBookedCount, color: 'border-sky-200 text-sky-700 bg-sky-50', activeColor: 'border-sky-500 text-sky-900 bg-sky-200' }] : []),
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
        const hasBookings = fs.occupied > 0 || fs.shifts > 0;
        return (
          <div className="flex items-start gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{fs.available}</p>
                <p className="text-xs text-emerald-600 font-medium">Available</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{fs.occupied}</p>
                <p className="text-xs text-red-600 font-medium">Reserved</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 text-center">
                <p className="text-2xl font-bold text-sky-700">{fs.shifts}</p>
                <p className="text-xs text-sky-600 font-medium">Shift Booked</p>
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

      {/* Toolbar: Search, Filter badges, and Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Cabin Number Search */}
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cabin # (e.g. 5, 12)..."
              value={cabinSearch}
              onChange={(e) => setCabinSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
            {cabinSearch && (
              <button
                onClick={() => setCabinSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {filterBadges.map((badge) => (
              <button
                key={badge.key}
                onClick={() => setFilterState(badge.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer',
                  filterState === badge.key ? badge.activeColor : badge.color
                )}
              >
                {badge.label}: {badge.count}
              </button>
            ))}
            {(filterState !== 'all' || cabinSearch) && (
              <button
                onClick={() => {
                  setFilterState('all');
                  setCabinSearch('');
                }}
                className="text-xs text-gray-400 hover:text-cyan-600 self-center ml-1 underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <Button onClick={() => setAddDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white shrink-0">
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
            <p className="font-semibold text-gray-600">
              {cabinSearch ? `No cabins found matching "${cabinSearch}"` : 'No cabins match the selected filter'}
            </p>
            <p className="text-sm mt-1">Try searching a different cabin number or clear active filters</p>
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
              {selectedCabin && (getCabinDisplayState(selectedCabin) === 'available' || getCabinDisplayState(selectedCabin) === 'partially_booked') && (
                <Button
                  onClick={() => setBookDialogOpen(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white mr-auto sm:mr-4"
                >
                  <CalendarPlus className="h-4 w-4 mr-1.5" />
                  Book Shift
                </Button>
              )}
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

      {/* Quick Book Dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-slate-100 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-sky-500" />
              Book Cabin #{selectedCabin?.cabinNum}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-5 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Student Details</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewStudentForm(!showNewStudentForm);
                  setBookStudentId('');
                  setBookStudentSearch('');
                }}
                className="h-8 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
              >
                {showNewStudentForm ? 'Search Existing' : (
                  <><UserPlus className="h-4 w-4 mr-1.5" /> Create New</>
                )}
              </Button>
            </div>
            
            {showNewStudentForm ? (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="h-8.5 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                    <Input
                      placeholder="e.g. 9876543210"
                      value={newStudentPhone}
                      onChange={(e) => setNewStudentPhone(e.target.value)}
                      className="h-8.5 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="student@example.com"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      className="h-8.5 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700">Password</Label>
                      <button
                        type="button"
                        onClick={() => setNewStudentPassword(generateSecurePassword())}
                        className="text-[11px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"
                      >
                        <Key className="h-3 w-3" /> Auto-generate
                      </button>
                    </div>
                    <Input
                      type="text"
                      placeholder="Leave blank to auto-generate"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      className="h-8.5 bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Home Address (Optional)</Label>
                    <Input
                      placeholder="e.g. Lamka, Churachandpur"
                      value={newStudentAddress}
                      onChange={(e) => setNewStudentAddress(e.target.value)}
                      className="h-8.5 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Notes / Batch (Optional)</Label>
                    <Input
                      placeholder="Optional notes..."
                      value={newStudentNotes}
                      onChange={(e) => setNewStudentNotes(e.target.value)}
                      className="h-8.5 bg-white text-xs"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  Credentials will be automatically sent via Brevo (<span className="font-mono">noreply@lamkacoaching.in</span>).
                </p>
              </div>
            ) : (
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <Label>Search Student (by Name or Phone)</Label>
                <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={studentSearchOpen}
                      className="w-full justify-between bg-white"
                    >
                      {bookStudentId
                        ? bookStudentOptions.find((s) => s.id === bookStudentId)?.name || 'Select student...'
                        : 'Select student...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 flex" align="start">
                    <Command className="w-full">
                      <CommandInput 
                        placeholder="Type to search..." 
                        value={bookStudentSearch}
                        onValueChange={setBookStudentSearch}
                      />
                      <CommandList>
                        {studentSearchLoading ? (
                          <CommandEmpty>Searching...</CommandEmpty>
                        ) : bookStudentOptions.length === 0 ? (
                          <CommandEmpty>
                            {bookStudentSearch.length >= 2 
                              ? 'No students found.' 
                              : 'Type at least 2 characters to search.'}
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {bookStudentOptions.map((s) => (
                              <CommandItem
                                key={s.id}
                                value={`${s.name} ${s.phone} ${s.id}`}
                                onSelect={() => {
                                  setBookStudentId(s.id);
                                  setStudentSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    bookStudentId === s.id ? "opacity-100 text-cyan-600" : "opacity-0"
                                  )}
                                />
                                {s.name} ({s.phone})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {credentialsBanner && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                <div>
                  <p className="font-semibold">Created: {credentialsBanner.name}</p>
                  <p className="font-mono text-[11px] text-emerald-700">
                    User: {credentialsBanner.phone} | Pwd: {credentialsBanner.password}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  onClick={() => {
                    navigator.clipboard.writeText(`Lamka Coaching Portal Login\nPhone: ${credentialsBanner.phone}\nUsername: @${credentialsBanner.username}\nPassword: ${credentialsBanner.password}\nLogin: ${window.location.origin}/login`);
                    toast.success('Credentials copied to clipboard!');
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select value={bookType} onValueChange={setBookType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Disable occupied shifts
                      const occupied = new Set(selectedCabin?.bookings.filter(b => b.status === 'active').map(b => b.type));
                      const isReserved = occupied.has('reserved');
                      return (
                        <>
                          <SelectItem value="morning_shift" disabled={isReserved || occupied.has('morning_shift')}>Morning Shift (5AM - 10AM)</SelectItem>
                          <SelectItem value="day_shift" disabled={isReserved || occupied.has('day_shift')}>Day Shift (10AM - 5PM)</SelectItem>
                          <SelectItem value="night_shift" disabled={isReserved || occupied.has('night_shift')}>Night Shift (5PM - 12AM)</SelectItem>
                          <SelectItem value="reserved" disabled={occupied.size > 0}>Reserved (24/7)</SelectItem>
                        </>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Fee (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={bookTotalAmount}
                  onChange={(e) => setBookTotalAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={bookStartDate}
                  onChange={(e) => setBookStartDate(e.target.value)}
                />
              </div>
              {bookType !== 'reserved' && (
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={bookEndDate}
                    onChange={(e) => setBookEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Fee Breakdown */}
            <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-100 space-y-2">
              <div className="flex justify-between text-sm text-cyan-800">
                <span>Monthly Fee (Editable)</span>
                <span>{formatCurrency((Number(bookTotalAmount) || 0) * 100)}</span>
              </div>
              {showNewStudentForm && (
                <div className="flex justify-between text-sm text-cyan-800">
                  <span>Registration Fee (One-time)</span>
                  <span>{formatCurrency(rates.registration * 100)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-cyan-900 pt-2 border-t border-cyan-200">
                <span>Total Amount Due</span>
                <span>{formatCurrency(((Number(bookTotalAmount) || 0) + (showNewStudentForm ? rates.registration : 0)) * 100)}</span>
              </div>
            </div>

            {/* Payment Record Section with Date Backdating */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={bookPayNow}
                    onChange={(e) => setBookPayNow(e.target.checked)}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                  />
                  Record Payment (Backdate / Instant Entry)
                </Label>
              </div>

              {bookPayNow && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700">Payment Amount (₹)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 500"
                        value={bookPayAmount}
                        onChange={(e) => setBookPayAmount(e.target.value)}
                        className="h-8.5 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700">Payment Date</Label>
                      <Input
                        type="date"
                        value={bookPaymentDate}
                        onChange={(e) => setBookPaymentDate(e.target.value)}
                        className="h-8.5 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700">Payment Mode</Label>
                      <Select value={bookPayMode} onValueChange={(val: 'cash' | 'upi') => setBookPayMode(val)}>
                        <SelectTrigger className="h-8.5 bg-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI / Online Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-700">Receipt / Invoice No (Optional)</Label>
                      <Input
                        placeholder="e.g. RCPT-2024-001"
                        value={bookReceiptNo}
                        onChange={(e) => setBookReceiptNo(e.target.value)}
                        className="h-8.5 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/75 shrink-0 rounded-b-lg flex flex-row items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setBookDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleQuickBook}
              disabled={submitting || (!showNewStudentForm && !bookStudentId) || (showNewStudentForm && (!newStudentName.trim() || !newStudentPhone.trim() || !newStudentEmail.trim()))}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
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
  const activeShifts = cabin.bookings.filter((b) => b.status === 'active' && ['morning_shift', 'day_shift', 'night_shift'].includes(b.type));

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
            {cabin.bookings.some(b => {
              if (b.status !== 'active' || !b.endDate) return false;
              const daysLeft = (new Date(b.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
              return daysLeft >= 0 && daysLeft <= 3;
            }) && (
              <div className="flex items-center justify-center h-5 w-5 bg-yellow-100 rounded-full" title="Booking expires in ≤ 3 days">
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
              </div>
            )}
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
        {(state === 'partially_booked' || state === 'fully_booked') && activeShifts.length > 0 && (
          <div className="mt-2 text-xs space-y-1.5">
            <p className="font-medium text-sky-800">{activeShifts.length} shift{activeShifts.length > 1 ? 's' : ''} booked</p>
            <div className="flex flex-wrap gap-1">
              {activeShifts.map((s, idx) => (
                <span key={idx} className="bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded capitalize text-[10px]">
                  {s.type.replace('_', ' ')}
                </span>
              ))}
            </div>
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
