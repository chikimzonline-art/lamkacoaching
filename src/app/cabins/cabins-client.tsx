'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DoorOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  CalendarDays,
  AlertCircle,
  Wifi,
  AirVent,
  Zap,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CabinInfo {
  id: string;
  floor: number;
  cabinNum: number;
  notes: string | null;
  isOccupied: boolean;
  shiftBookingsToday: { startTime: string; endTime: string }[];
  activeBookingsCount: number;
}

interface FloorGroup {
  floor: number;
  label: string;
  cabins: CabinInfo[];
}

interface CabinData {
  cabins: CabinInfo[];
  cabinsByFloor: FloorGroup[];
  floors: number[];
  pricing: {
    morningRate: number;
    dayRate: number;
    nightRate: number;
    monthlyRate: number;
    regFee: number;
  };
  totalCabins: number;
  availableCabins: number;
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

export default function CabinsClient({ initialCabinData }: { initialCabinData: CabinData }) {
  const data = initialCabinData;
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'shift' | 'reserved'>('reserved');
  const [selectedShift, setSelectedShift] = useState<'morning' | 'day' | 'night'>('morning');
  const [activeFloor, setActiveFloor] = useState<number | 'all'>('all');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const availableCabins = data?.cabins.filter((c) => !c.isOccupied) || [];
  const selectedCabinInfo = data?.cabins.find((c) => c.id === selectedCabin);

  // Get cabins for the selected floor
  const displayCabins = activeFloor === 'all'
    ? (data?.cabins || [])
    : (data?.cabins.filter((c) => c.floor === activeFloor) || []);

  // Pricing constants and calculations
  const regFeeVal = data?.pricing.regFee || 500;
  let baseRateVal = 0;
  if (data) {
    if (bookingType === 'reserved') {
      baseRateVal = data.pricing.monthlyRate;
    } else {
      if (selectedShift === 'morning') {
        baseRateVal = data.pricing.morningRate;
      } else if (selectedShift === 'day') {
        baseRateVal = data.pricing.dayRate;
      } else {
        baseRateVal = data.pricing.nightRate;
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const startTimeVal = bookingType === 'shift'
        ? (selectedShift === 'morning' ? '05:00' : selectedShift === 'day' ? '10:00' : '17:00')
        : undefined;
      const endTimeVal = bookingType === 'shift'
        ? (selectedShift === 'morning' ? '10:00' : selectedShift === 'day' ? '17:00' : '00:00')
        : undefined;

      const res = await fetch('/api/public/book-cabin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          address: address || undefined,
          cabinId: selectedCabin,
          bookingType,
          startDate,
          startTime: startTimeVal,
          endTime: endTimeVal,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Booking failed. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (submitted) {
    return (
      <PublicLayout>
        <section className="py-20 sm:py-28 bg-white dark:bg-gray-950">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-5">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Booking Request Submitted!</h1>
            <p className="text-gray-550 dark:text-gray-400 text-lg leading-relaxed mb-6">
              Your cabin booking request has been received. We will contact you shortly to confirm your booking and arrange payment.
            </p>
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 rounded-xl p-5 mb-6 text-left">
              <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-1">What happens next?</p>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  Our team will review your booking request
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  We will call you to confirm the details
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  Payment can be made at the center on your first visit
                </li>
              </ul>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/">
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  Back to Home
                </Button>
              </Link>
              <Link href="/cabins">
                <Button variant="outline" onClick={() => { setSubmitted(false); setSelectedCabin(null); setName(''); setPhone(''); setEmail(''); setAddress(''); }}>
                  Book Another Cabin
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-700 to-emerald-600 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <DoorOpen className="h-7 w-7 text-green-200" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Study Cabin Booking</h1>
          </div>
          <p className="mt-2 text-lg max-w-xl mx-auto text-white/80">
            Book a quiet, comfortable study space — Reserved (Full Day) or Shift bookings
          </p>
          {data && (
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-white/60">
              <span>{data.totalCabins} total cabins</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="text-green-200 font-semibold">{data.availableCabins} available now</span>
              {data.floors.length > 1 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{data.floors.length} floors ({data.floors.map(f => formatFloorLabel(f)).join(', ')})</span>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pricing overview */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <CalendarDays className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Reserved Booking</h3>
                  <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">₹{data.pricing.monthlyRate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
                  <p className="text-sm text-gray-550 dark:text-gray-400 mt-2 leading-relaxed">
                    Get full-day exclusive access to your assigned cabin. Perfect for dedicated students seeking a permanent setup.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-900/20 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  + ₹{data.pricing.regFee} One-time Registration Fee
                </div>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/30 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <Clock className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mb-2" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Shift Bookings</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Morning Shift <span className="font-normal text-xs text-gray-500">(5:00 AM - 10:00 AM)</span></span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-400">₹{data.pricing.morningRate}/mo</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Day Shift <span className="font-normal text-xs text-gray-500">(10:00 AM - 5:00 PM)</span></span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-400">₹{data.pricing.dayRate}/mo</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Night Shift <span className="font-normal text-xs text-gray-500">(5:00 PM - 12:00 AM)</span></span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-400">₹{data.pricing.nightRate}/mo</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-cyan-100 dark:border-cyan-900/20 text-xs text-cyan-700 dark:text-cyan-400 font-medium">
                  + ₹{data.pricing.regFee} One-time Registration Fee
                </div>
              </div>
            </div>
          )}

          {/* Cabin features */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm text-gray-500 dark:text-gray-400">
            {[
              { icon: <Wifi className="h-4 w-4 text-green-600" />, text: 'Free Wi-Fi' },
              { icon: <AirVent className="h-4 w-4 text-green-600" />, text: 'Air Conditioned' },
              { icon: <Zap className="h-4 w-4 text-green-600" />, text: 'Power Outlets' },
              { icon: <ShieldCheck className="h-4 w-4 text-green-600" />, text: 'Secure Environment' },
            ].map((feat) => (
              <div key={feat.text} className="flex items-center gap-1.5">
                {feat.icon}
                <span className="font-medium text-gray-600 dark:text-gray-300">{feat.text}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Cabin Selection */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Select a Cabin</h2>

              {/* Floor Tabs */}
              {data && data.floors.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setActiveFloor('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                      activeFloor === 'all'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-300'
                    )}
                  >
                    All Floors
                  </button>
                  {data.cabinsByFloor.map((fg) => {
                    const availCount = fg.cabins.filter((c) => !c.isOccupied).length;
                    return (
                      <button
                        key={fg.floor}
                        onClick={() => setActiveFloor(fg.floor)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                          activeFloor === fg.floor
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-300'
                        )}
                      >
                        <Building2 className="h-3 w-3" />
                        {fg.label}
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full',
                          activeFloor === fg.floor
                            ? 'bg-white/20 text-white'
                            : availCount > 0
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )}>
                          {availCount} free
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {data && (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {/* Group by floor when showing all floors */}
                  {activeFloor === 'all' && data.floors.length > 1 ? (
                    data.cabinsByFloor.map((fg) => (
                      <div key={fg.floor}>
                        <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fg.label}</span>
                          <Badge variant="outline" className="text-[10px] text-gray-500 dark:text-gray-400">
                            {fg.cabins.filter((c) => !c.isOccupied).length} available
                          </Badge>
                        </div>
                        {fg.cabins.map((cabin) => (
                          <CabinListItem
                            key={cabin.id}
                            cabin={cabin}
                            isSelected={selectedCabin === cabin.id}
                            showFloorLabel={false}
                            onSelect={() => !cabin.isOccupied && setSelectedCabin(cabin.id)}
                          />
                        ))}
                      </div>
                    ))
                  ) : (
                    displayCabins.map((cabin) => (
                      <CabinListItem
                        key={cabin.id}
                        cabin={cabin}
                        isSelected={selectedCabin === cabin.id}
                        showFloorLabel={activeFloor === 'all'}
                        onSelect={() => !cabin.isOccupied && setSelectedCabin(cabin.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Right: Booking Form */}
            <div className="lg:col-span-3">
              {!selectedCabin ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center">
                  <DoorOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Select a Cabin</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose an available cabin from the list to start your booking</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedCabinInfo?.cabinNum}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">
                        Cabin {selectedCabinInfo?.cabinNum}
                        <span className="ml-2 text-sm font-normal text-gray-400">on {selectedCabinInfo ? formatFloorLabel(selectedCabinInfo.floor) : ''}</span>
                      </h3>
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {selectedCabinInfo ? formatFloorLabel(selectedCabinInfo.floor) : ''} — Available
                      </p>
                    </div>
                  </div>

                  {/* Booking Type */}
                  <div className="mb-6">
                    <Label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">Booking Type</Label>
                    <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setBookingType('reserved')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                          bookingType === 'reserved'
                            ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        )}
                      >
                        <CalendarDays className="h-4 w-4" />
                        Reserved
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('shift')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                          bookingType === 'shift'
                            ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        )}
                      >
                        <Clock className="h-4 w-4" />
                        Shift
                      </button>
                    </div>
                  </div>

                  {/* Shift Selection (only visible if bookingType is shift) */}
                  {bookingType === 'shift' && (
                    <div className="mb-6">
                      <Label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">Select Shift *</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          {
                            id: 'morning',
                            name: 'Morning Shift',
                            time: '5:00 AM - 10:00 AM (5 hrs/day)',
                            rate: data.pricing.morningRate,
                          },
                          {
                            id: 'day',
                            name: 'Day Shift',
                            time: '10:00 AM - 5:00 PM (7 hrs/day)',
                            rate: data.pricing.dayRate,
                          },
                          {
                            id: 'night',
                            name: 'Night Shift',
                            time: '5:00 PM - 12:00 AM (7 hrs/day)',
                            rate: data.pricing.nightRate,
                          },
                        ].map((shift) => (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => setSelectedShift(shift.id as 'morning' | 'day' | 'night')}
                            className={cn(
                              'w-full flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer',
                              selectedShift === shift.id
                                ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-900 dark:text-green-300 font-semibold'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                            )}
                          >
                            <div>
                              <p className="text-sm font-bold">{shift.name}</p>
                              <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5">{shift.time}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-extrabold text-green-600 dark:text-green-400">₹{shift.rate}</p>
                              <p className="text-[10px] text-gray-400">/month</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {bookingType === 'reserved' ? (
                      <>
                        <div>
                          <Label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                          <div className="flex items-center h-9 px-3 rounded-md border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
                            1 Month (exclusive access, auto-renewable)
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="startDateH" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
                          <Input
                            id="startDateH"
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                          <div className="flex items-center h-9 px-3 rounded-md border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
                            1 Month ({selectedShift === 'morning' ? 'Morning' : selectedShift === 'day' ? 'Day' : 'Night'} Shift, auto-renewable)
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Personal Details */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-5 mb-5">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</Label>
                        <Input
                          id="name"
                          required
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number *</Label>
                        <Input
                          id="phone"
                          required
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          maxLength={10}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Address (optional)</Label>
                        <Input
                          id="address"
                          placeholder="Your address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estimated Cost Breakdown */}
                  <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/20 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Monthly Fee ({bookingType === 'reserved' ? 'Reserved' : `${selectedShift === 'morning' ? 'Morning' : selectedShift === 'day' ? 'Day' : 'Night'} Shift`})</span>
                      <span className="font-semibold">{formatCurrency(baseRateVal * 100)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Registration Fee (One-time)</span>
                      <span className="font-semibold">{formatCurrency(regFeeVal * 100)}</span>
                    </div>
                    <div className="border-t border-green-200 dark:border-green-900/40 my-2 pt-2 flex items-center justify-between text-base">
                      <span className="font-bold text-gray-900 dark:text-gray-100">Total Amount</span>
                      <span className="text-xl font-extrabold text-green-700 dark:text-green-400">{formatCurrency((baseRateVal + regFeeVal) * 100)}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-1">Payment to be made at the center upon confirmation</p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-5 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base rounded-xl gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Booking Request
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    Your booking is a request. We will confirm and arrange payment on your first visit.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

// Cabin list item component
function CabinListItem({ cabin, isSelected, showFloorLabel, onSelect }: {
  cabin: CabinInfo;
  isSelected: boolean;
  showFloorLabel: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={cabin.isOccupied}
      className={cn(
        'w-full text-left rounded-xl border-2 p-4 transition-all mb-2 cursor-pointer',
        cabin.isOccupied
          ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
          : isSelected
            ? 'bg-green-50 dark:bg-green-950/30 border-green-500 shadow-md shadow-green-100 dark:shadow-green-900/20'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50/30 dark:hover:bg-green-950/20'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm',
            cabin.isOccupied
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              : isSelected
                ? 'bg-green-600 text-white'
                : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
          )}>
            {cabin.cabinNum}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Cabin {cabin.cabinNum}
              {showFloorLabel && (
                <span className="ml-2 text-xs text-gray-400 font-normal inline-flex items-center gap-0.5">
                  <Building2 className="h-3 w-3" />
                  {formatFloorLabel(cabin.floor)}
                </span>
              )}
            </p>
            {!cabin.isOccupied && (
              <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                Available
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-500 dark:text-gray-400">{formatFloorLabel(cabin.floor)}</span>
              </p>
            )}
            {cabin.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{cabin.notes}</p>
            )}
          </div>
        </div>
        <Badge
          className={cn(
            'text-[11px]',
            cabin.isOccupied
              ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
          )}
        >
          {cabin.isOccupied ? 'Occupied' : 'Available'}
        </Badge>
      </div>
      {!cabin.isOccupied && cabin.shiftBookingsToday && cabin.shiftBookingsToday.length > 0 && (
        <div className="mt-2 pt-2 border-t border-green-100 dark:border-green-900/30">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Booked shifts today:</p>
          <div className="flex flex-wrap gap-1">
            {cabin.shiftBookingsToday.map((h, i) => (
              <span key={i} className="text-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded">
                {h.startTime === '05:00' ? 'Morning' : h.startTime === '10:00' ? 'Day' : 'Night'} ({h.startTime} - {h.endTime === '00:00' ? '12 AM' : h.endTime})
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
