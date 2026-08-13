'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  hourlyBookingsToday: { startTime: string; endTime: string }[];
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
    hourlyMonthlyRate: number;
    monthlyRate: number;
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

export default function CabinsPage() {
  const [data, setData] = useState<CabinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'hourly' | 'monthly'>('monthly');
  const [activeFloor, setActiveFloor] = useState<number | 'all'>('all');

  const { data: session } = useSession();

  useEffect(() => {
    fetch('/api/public/cabins')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const availableCabins = data?.cabins.filter((c) => !c.isOccupied) || [];
  const selectedCabinInfo = data?.cabins.find((c) => c.id === selectedCabin);

  // Get cabins for the selected floor
  const displayCabins = activeFloor === 'all'
    ? (data?.cabins || [])
    : (data?.cabins.filter((c) => c.floor === activeFloor) || []);

  // Calculate estimated amount
  let estimatedAmount = 0;
  if (data && bookingType === 'hourly') {
    estimatedAmount = data.pricing.hourlyMonthlyRate * 100;
  } else if (data && bookingType === 'monthly') {
    estimatedAmount = data.pricing.monthlyRate * 100;
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
            Book a quiet, comfortable study space — hourly (5 hrs/day) or full-day monthly
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 rounded-2xl p-6 text-center">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Hourly Booking</h3>
                <p className="text-3xl font-extrabold text-green-700 dark:text-green-400 mt-1">₹{data.pricing.hourlyMonthlyRate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">5 hours/day &bull; 1 month duration</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 text-center">
                <CalendarDays className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Monthly Booking</h3>
                <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">₹{data.pricing.monthlyRate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Full-day access, best value for regular students</p>
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

              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && data && (
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
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-sm">
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
                        onClick={() => setBookingType('monthly')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                          bookingType === 'monthly'
                            ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        )}
                      >
                        <CalendarDays className="h-4 w-4" />
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('hourly')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                          bookingType === 'hourly'
                            ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        )}
                      >
                        <Clock className="h-4 w-4" />
                        Hourly
                      </button>
                    </div>
                  </div>

                  {/* Estimated Cost */}
                  {estimatedAmount > 0 && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 rounded-xl p-4 mb-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Amount</span>
                        <span className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(estimatedAmount)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Payable in the student dashboard upon booking</p>
                    </div>
                  )}

                  {/* Submit */}
                  <Link href={session ? "/dashboard/cabins" : "/login?callbackUrl=/dashboard/cabins"} className="block w-full">
                    <Button
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base rounded-xl gap-2"
                    >
                      {session ? "Book Now in Dashboard" : "Login to Book Cabin"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    You will be redirected to the student dashboard to complete your booking.
                  </p>
                </div>
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
        'w-full text-left rounded-xl border-2 p-4 transition-all mb-2',
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
      {!cabin.isOccupied && cabin.hourlyBookingsToday.length > 0 && (
        <div className="mt-2 pt-2 border-t border-green-100 dark:border-green-900/30">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Booked hours today:</p>
          <div className="flex flex-wrap gap-1">
            {cabin.hourlyBookingsToday.map((h, i) => (
              <span key={i} className="text-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded">
                {h.startTime} - {h.endTime}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
