'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  History,
  UserPlus,
  Check,
  ChevronsUpDown,
  Key,
  Copy,
  Calendar,
  CreditCard,
  Building,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/helpers';
import { generateSecurePassword } from '@/lib/email';
import { useDebouncedSearch } from '@/lib/hooks/use-debounced-search';
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

interface Milestone {
  index: number;
  monthNumber: number;
  label: string;
  date: Date;
  dateString: string;
  amount: number;
  hasRegFee: boolean;
}

interface HistoricalBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCabin?: Cabin | null;
  cabins: Cabin[];
  rates: {
    morning: number;
    day: number;
    night: number;
    reserved: number;
    registration: number;
  };
  onSuccess: () => void;
}

export function HistoricalBookingDialog({
  open,
  onOpenChange,
  selectedCabin,
  cabins,
  rates,
  onSuccess,
}: HistoricalBookingDialogProps) {
  // Mode: Existing Student vs New Student
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);

  // Student selection / creation state
  const [studentId, setStudentId] = useState('');
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
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
    password?: string;
    emailSent?: boolean;
  } | null>(null);

  // Cabin & Shift state
  const [targetCabinId, setTargetCabinId] = useState('');
  const [shiftType, setShiftType] = useState('reserved');
  const [monthlyRate, setMonthlyRate] = useState<string>('1100');

  // Dates state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fee & Registration state
  const [includeRegFee, setIncludeRegFee] = useState(false);

  // Payment Status state
  const [paymentOption, setPaymentOption] = useState<'all' | 'partial' | 'unpaid'>('all');
  const [paidMonthsIndex, setPaidMonthsIndex] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [receiptPrefix, setReceiptPrefix] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  // Debounced search for student lookup
  const fetchStudentOptionsFn = useCallback(async (query: string, signal: AbortSignal) => {
    const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&take=15`, { signal });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  }, []);

  const {
    query: studentSearch,
    setQuery: setStudentSearch,
    results: studentSearchRes,
    loading: studentSearchLoading,
  } = useDebouncedSearch<{ students: Array<{ id: string; name: string; phone: string; email?: string }> }>(
    fetchStudentOptionsFn,
    250
  );

  const studentOptions = useMemo(() => {
    return studentSearchRes?.students || [];
  }, [studentSearchRes]);

  // Set default cabin when modal opens
  useEffect(() => {
    if (open) {
      if (selectedCabin) {
        setTargetCabinId(selectedCabin.id);
      } else if (cabins.length > 0 && !targetCabinId) {
        setTargetCabinId(cabins[0].id);
      }

      // Default to 1st of previous 6 months if not set
      if (!startDate) {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        d.setDate(1);
        setStartDate(d.toISOString().split('T')[0]);
      }
      if (!endDate) {
        const d = new Date();
        // End of current month
        const endMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        setEndDate(endMonth.toISOString().split('T')[0]);
      }
    }
  }, [open, selectedCabin, cabins, targetCabinId, startDate, endDate]);

  // Sync monthly rate with shift type
  useEffect(() => {
    if (shiftType === 'reserved') setMonthlyRate(String(rates.reserved || 1100));
    else if (shiftType === 'morning_shift') setMonthlyRate(String(rates.morning || 500));
    else if (shiftType === 'day_shift') setMonthlyRate(String(rates.day || 800));
    else if (shiftType === 'night_shift') setMonthlyRate(String(rates.night || 800));
  }, [shiftType, rates]);

  // Calculate monthly milestones and financial preview
  const monthlyMilestones = useMemo<Milestone[]>(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();

    const totalMonths = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
    const rate = Number(monthlyRate) || 0;
    const regFee = includeRegFee ? (rates.registration || 200) : 0;

    const list: Milestone[] = [];
    for (let i = 0; i < totalMonths; i++) {
      const mDate = new Date(startYear, startMonth + i, 1, 12, 0, 0);
      const mLabel = mDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const isFirst = i === 0;
      const monthAmount = rate + (isFirst ? regFee : 0);

      list.push({
        index: i,
        monthNumber: i + 1,
        label: mLabel,
        date: mDate,
        dateString: mDate.toISOString().split('T')[0],
        amount: monthAmount,
        hasRegFee: isFirst && regFee > 0,
      });
    }
    return list;
  }, [startDate, endDate, monthlyRate, includeRegFee, rates.registration]);

  // Initialize paidMonthsIndex to all when milestones change
  useEffect(() => {
    if (paymentOption === 'all') {
      setPaidMonthsIndex(monthlyMilestones.length);
    } else if (paymentOption === 'unpaid') {
      setPaidMonthsIndex(0);
    }
  }, [monthlyMilestones.length, paymentOption]);

  const totalCalculatedAmount = useMemo(() => {
    return monthlyMilestones.reduce((acc, m) => acc + m.amount, 0);
  }, [monthlyMilestones]);

  const paidMonthsCount = useMemo(() => {
    if (paymentOption === 'all') return monthlyMilestones.length;
    if (paymentOption === 'unpaid') return 0;
    return Math.min(Math.max(paidMonthsIndex, 0), monthlyMilestones.length);
  }, [paymentOption, paidMonthsIndex, monthlyMilestones.length]);

  const totalPaidAmount = useMemo(() => {
    return monthlyMilestones.slice(0, paidMonthsCount).reduce((acc, m) => acc + m.amount, 0);
  }, [monthlyMilestones, paidMonthsCount]);

  const totalDueAmount = Math.max(0, totalCalculatedAmount - totalPaidAmount);

  // Helper to create inline student
  const handleCreateInlineStudent = async () => {
    if (!newStudentName.trim() || !newStudentPhone.trim() || !newStudentEmail.trim()) {
      toast.error('Student name, phone, and email are required');
      return null;
    }
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

      return json.student.id;
    } catch {
      toast.error('Failed to create student account');
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!targetCabinId) {
      toast.error('Please select a cabin');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please specify both start date and active until date');
      return;
    }
    if (monthlyMilestones.length === 0) {
      toast.error('Invalid date range');
      return;
    }

    let finalStudentId = studentId;

    if (showNewStudentForm) {
      const newId = await handleCreateInlineStudent();
      if (!newId) return;
      finalStudentId = newId;
    }

    if (!finalStudentId) {
      toast.error('Please select or create a student');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard_historical',
          studentId: finalStudentId,
          cabinId: targetCabinId,
          type: shiftType,
          startDate,
          endDate,
          monthlyRate: Number(monthlyRate),
          includeRegistrationFee: includeRegFee,
          registrationFee: rates.registration || 200,
          paidMonthsCount,
          paymentMode,
          paymentDay: 1,
          receiptPrefix: receiptPrefix.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to onboard historical booking');
        return;
      }

      toast.success(
        `Successfully onboarded student! Created booking (${json.totalMonths} months) with ${json.paymentsCount} payments recorded.`
      );

      onSuccess();
      if (!credentialsBanner) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Error onboarding historical booking:', err);
      toast.error('An unexpected error occurred while onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border border-slate-200 shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-300">
              <History className="h-5 w-5 text-amber-600" />
              Onboard Existing / Backdated Student Booking
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Backdate multi-month cabin admissions and automatically generate individual monthly payment receipts in one step.
          </p>
        </DialogHeader>

        <div className="space-y-4 p-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Credentials Banner */}
          {credentialsBanner && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-900 shadow-sm animate-in fade-in">
              <div>
                <p className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Student Registered: {credentialsBanner.name}
                </p>
                <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
                  Phone: {credentialsBanner.phone} | Username: @{credentialsBanner.username} | Password: {credentialsBanner.password || '******'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Lamka Coaching Portal Login\nPhone: ${credentialsBanner.phone}\nUsername: @${credentialsBanner.username}\nPassword: ${credentialsBanner.password}\nLogin: ${window.location.origin}/login`
                  );
                  toast.success('Credentials copied to clipboard!');
                }}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy Login
              </Button>
            </div>
          )}

          {/* Section 1: Student Information */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-amber-600" />
                1. Student Information *
              </Label>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setShowNewStudentForm(!showNewStudentForm);
                  setStudentId('');
                  setStudentSearch('');
                }}
                className="h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100/60"
              >
                {showNewStudentForm ? 'Search Existing Student' : '+ Register New Student'}
              </Button>
            </div>

            {showNewStudentForm ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Full Name *</Label>
                    <Input
                      placeholder="e.g. Thangminlun"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Phone Number *</Label>
                    <Input
                      placeholder="e.g. 9862000000"
                      value={newStudentPhone}
                      onChange={(e) => setNewStudentPhone(e.target.value)}
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="student@example.com"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold text-slate-700">Password</Label>
                      <button
                        type="button"
                        onClick={() => setNewStudentPassword(generateSecurePassword())}
                        className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5"
                      >
                        <Key className="h-2.5 w-2.5" /> Auto-generate
                      </button>
                    </div>
                    <Input
                      placeholder="Leave blank to auto-generate"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      className="h-8 bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Address (Optional)</Label>
                    <Input
                      placeholder="e.g. Lamka"
                      value={newStudentAddress}
                      onChange={(e) => setNewStudentAddress(e.target.value)}
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Notes (Optional)</Label>
                    <Input
                      placeholder="e.g. Old student legacy"
                      value={newStudentNotes}
                      onChange={(e) => setNewStudentNotes(e.target.value)}
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={studentSearchOpen}
                      className="w-full justify-between bg-white text-xs h-9 font-normal"
                    >
                      {studentId
                        ? studentOptions.find((s) => s.id === studentId)?.name
                          ? `${studentOptions.find((s) => s.id === studentId)?.name} (${studentOptions.find((s) => s.id === studentId)?.phone})`
                          : 'Selected student'
                        : 'Search student by name or phone...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] sm:w-[480px] p-0" align="start">
                    <Command className="w-full">
                      <CommandInput
                        placeholder="Type student name or phone..."
                        value={studentSearch}
                        onValueChange={setStudentSearch}
                        className="text-xs"
                      />
                      <CommandList>
                        {studentSearchLoading ? (
                          <CommandEmpty className="text-xs py-3 text-slate-400">Searching students...</CommandEmpty>
                        ) : studentOptions.length === 0 ? (
                          <CommandEmpty className="text-xs py-3 text-slate-400">
                            {studentSearch.length >= 2 ? 'No matching students found.' : 'Type at least 2 characters to search.'}
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {studentOptions.map((s) => (
                              <CommandItem
                                key={s.id}
                                value={`${s.name} ${s.phone} ${s.id}`}
                                onSelect={() => {
                                  setStudentId(s.id);
                                  setStudentSearchOpen(false);
                                }}
                                className="text-xs py-2 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-3.5 w-3.5',
                                    studentId === s.id ? 'opacity-100 text-amber-600' : 'opacity-0'
                                  )}
                                />
                                <div className="flex-1">
                                  <span className="font-semibold text-slate-800">{s.name}</span>
                                  <span className="text-slate-500 ml-2">({s.phone})</span>
                                </div>
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
          </div>

          {/* Section 2: Cabin & Shift Selection */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-amber-600" />
              2. Cabin & Shift Details *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Cabin Desk</Label>
                <Select value={targetCabinId} onValueChange={setTargetCabinId}>
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue placeholder="Select Cabin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {cabins.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        Cabin #{c.cabinNum} (Floor {c.floor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Shift Type</Label>
                <Select value={shiftType} onValueChange={setShiftType}>
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserved" className="text-xs">Full Reserved (24/7)</SelectItem>
                    <SelectItem value="morning_shift" className="text-xs">Morning Shift (5AM - 10AM)</SelectItem>
                    <SelectItem value="day_shift" className="text-xs">Day Shift (10AM - 5PM)</SelectItem>
                    <SelectItem value="night_shift" className="text-xs">Night Shift (5PM - 12AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Monthly Rate (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1100"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(e.target.value)}
                  className="h-8 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Timeline & Duration */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-600" />
                3. Admission Timeline & Duration *
              </Label>
              {monthlyMilestones.length > 0 && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-[11px]">
                  ⏱️ {monthlyMilestones.length} {monthlyMilestones.length === 1 ? 'Month' : 'Months'} Continuous
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Admission Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Active Until Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="includeRegFee"
                checked={includeRegFee}
                onCheckedChange={(checked) => setIncludeRegFee(!!checked)}
              />
              <label
                htmlFor="includeRegFee"
                className="text-xs text-slate-700 font-medium cursor-pointer select-none"
              >
                Include one-time registration fee ({formatCurrency((rates.registration || 200) * 100)}) on 1st month
              </label>
            </div>
          </div>

          {/* Section 4: Payment History & Settings */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-3">
            <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-amber-600" />
              4. Historical Payment Settings
            </Label>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label
                  onClick={() => setPaymentOption('all')}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors',
                    paymentOption === 'all'
                      ? 'bg-amber-100/80 border-amber-500 font-semibold text-amber-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentOption === 'all'}
                    onChange={() => setPaymentOption('all')}
                    className="accent-amber-600"
                  />
                  <span>All {monthlyMilestones.length} Months Paid</span>
                </label>

                <label
                  onClick={() => setPaymentOption('partial')}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors',
                    paymentOption === 'partial'
                      ? 'bg-amber-100/80 border-amber-500 font-semibold text-amber-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentOption === 'partial'}
                    onChange={() => setPaymentOption('partial')}
                    className="accent-amber-600"
                  />
                  <span>Paid Up To Specific Month</span>
                </label>

                <label
                  onClick={() => setPaymentOption('unpaid')}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors',
                    paymentOption === 'unpaid'
                      ? 'bg-amber-100/80 border-amber-500 font-semibold text-amber-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentOption === 'unpaid'}
                    onChange={() => setPaymentOption('unpaid')}
                    className="accent-amber-600"
                  />
                  <span>All Months Unpaid / Due</span>
                </label>
              </div>

              {paymentOption === 'partial' && (
                <div className="pt-2">
                  <Label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Select last paid month:
                  </Label>
                  <Select
                    value={String(paidMonthsIndex)}
                    onValueChange={(val) => setPaidMonthsIndex(Number(val))}
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthlyMilestones.map((m, idx) => (
                        <SelectItem key={m.index} value={String(idx + 1)} className="text-xs">
                          Paid up to {m.label} ({idx + 1} of {monthlyMilestones.length} months)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash" className="text-xs">Cash</SelectItem>
                    <SelectItem value="upi" className="text-xs">UPI / GPay / PhonePe</SelectItem>
                    <SelectItem value="bank_transfer" className="text-xs">Bank Transfer (NEFT/IMPS)</SelectItem>
                    <SelectItem value="card" className="text-xs">Debit / Credit Card</SelectItem>
                    <SelectItem value="cheque" className="text-xs">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Receipt No. Prefix (Optional)</Label>
                <Input
                  placeholder="e.g. REC-2025"
                  value={receiptPrefix}
                  onChange={(e) => setReceiptPrefix(e.target.value)}
                  className="h-8 bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-[11px] font-semibold text-slate-700">Notes (Optional)</Label>
              <Input
                placeholder="e.g. Historical booking migration"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 bg-white text-xs"
              />
            </div>
          </div>

          {/* Section 5: Financial Summary & Monthly Breakdown Preview */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-xs text-slate-400">Total Booking Fee</span>
                <p className="text-base font-bold text-white">{formatCurrency(totalCalculatedAmount * 100)}</p>
              </div>
              <div>
                <span className="text-xs text-emerald-400">Total Paid (Historical)</span>
                <p className="text-base font-bold text-emerald-400">{formatCurrency(totalPaidAmount * 100)}</p>
              </div>
              <div>
                <span className="text-xs text-rose-400">Balance Due</span>
                <p className="text-base font-bold text-rose-400">{formatCurrency(totalDueAmount * 100)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-300">
                Generated Monthly Payment Records ({paidMonthsCount} / {monthlyMilestones.length} Paid)
              </span>
              <button
                type="button"
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                {previewExpanded ? 'Collapse List' : 'Expand List'}
              </button>
            </div>

            {previewExpanded && (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {monthlyMilestones.map((m, idx) => {
                  const isPaid = idx < paidMonthsCount;
                  return (
                    <div
                      key={m.index}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg text-xs font-mono',
                        isPaid ? 'bg-slate-800/90 text-slate-200' : 'bg-rose-950/40 text-rose-300 border border-rose-900/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">#{m.monthNumber}</span>
                        <span>{m.label} ({m.dateString})</span>
                        {m.hasRegFee && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded">
                            +Reg Fee
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatCurrency(m.amount * 100)}</span>
                        {isPaid ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-sans">
                            ✓ {paymentMode.toUpperCase()} Paid
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-sans">
                            Pending Due
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || monthlyMilestones.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
          >
            <History className="h-4 w-4 mr-1.5" />
            {submitting ? 'Onboarding Student...' : `Confirm & Onboard (${monthlyMilestones.length} Months)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
