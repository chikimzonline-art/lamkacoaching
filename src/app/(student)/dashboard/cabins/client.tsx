'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DoorOpen,
  Clock,
  ArrowRight,
  CalendarDays,
  AlertCircle,
  Wifi,
  AirVent,
  Zap,
  ShieldCheck,
  Building2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookCabin } from './actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { processPayment } from '@/lib/razorpay';
import { RazorpayCheckoutButton } from '@/components/payments/razorpay-checkout-button';
import { CancelBookingButton } from '@/components/bookings/cancel-booking-button';

interface CabinInfo {
  id: string;
  floor: number;
  cabinNum: number;
  notes: string | null;
  isOccupied: boolean;
  isBookedByMe?: boolean;
  bookedShifts: string[];
  hourlyBookingsToday: { startTime: string; endTime: string, type: string }[];
  activeBookingsCount: number;
}

interface FloorGroup {
  floor: number;
  label: string;
  cabins: CabinInfo[];
}

interface DashboardCabinsClientProps {
  cabins: CabinInfo[];
  cabinsByFloor: FloorGroup[];
  floors: number[];
  pricing: {
    registrationFee: number;
    reservedRate: number;
    morningShiftRate: number;
    dayShiftRate: number;
    nightShiftRate: number;
  };
  isFirstBooking: boolean;
  pendingCheckout?: {
    id: string;
    type: string;
    totalAmount: number;
    cabinInfo: {
      floor: number;
      cabinNum: number;
    }
  } | null;
  totalCabins: number;
  availableCabins: number;
  student: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

export default function DashboardCabinsClient({ data }: { data: DashboardCabinsClientProps }) {
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'reserved' | 'morning_shift' | 'day_shift' | 'night_shift'>('reserved');
  const [activeFloor, setActiveFloor] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const availableCabins = data.cabins.filter((c) => !c.isOccupied) || [];
  const selectedCabinInfo = data.cabins.find((c) => c.id === selectedCabin);

  // Get cabins for the selected floor
  const displayCabins = activeFloor === 'all'
    ? data.cabins
    : data.cabins.filter((c) => c.floor === activeFloor);

  // Calculate estimated amount
  let estimatedAmount = 0;
  if (bookingType === 'reserved') {
    estimatedAmount = data.pricing.reservedRate * 100;
  } else if (bookingType === 'morning_shift') {
    estimatedAmount = data.pricing.morningShiftRate * 100;
  } else if (bookingType === 'day_shift') {
    estimatedAmount = data.pricing.dayShiftRate * 100;
  } else if (bookingType === 'night_shift') {
    estimatedAmount = data.pricing.nightShiftRate * 100;
  }
  
  if (data.isFirstBooking) {
    estimatedAmount += data.pricing.registrationFee * 100;
  }

  async function handleBook() {
    if (!selectedCabin) return;
    setError('');
    setSubmitting(true);
    
    try {
      // 1. Create the booking record (status: pending_payment)
      const res = await bookCabin(selectedCabin, bookingType, startDate);
      if (!res?.success || !res?.bookingId) {
        throw new Error("Failed to reserve cabin");
      }

      // 2. Create Razorpay Order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: estimatedAmount,
          notes: {
            studentId: data.student.id,
            type: 'cabin',
            itemId: selectedCabin,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // 3. Launch Razorpay Checkout
      await processPayment({
        amount: estimatedAmount,
        orderId: orderData.orderId,
        name: 'Lamka Coaching Center',
        description: `Booking for Cabin ${selectedCabinInfo?.cabinNum}`,
        notes: {
          studentId: data.student.id,
          type: 'cabin',
          itemId: selectedCabin,
        },
        prefill: {
          name: data.student.name,
          email: data.student.email ?? undefined,
          contact: data.student.phone,
        },
        onSuccess: (response: any) => {
          toast.success("Cabin booked successfully!");
          setSubmitting(false);
          router.push(`/dashboard/success?type=cabin&id=${selectedCabin}&payment_id=${response.razorpay_payment_id}`);
        },
        onFailure: (err) => {
          setError(err.message || "Payment failed or was cancelled.");
          setSubmitting(false);
        },
      });
    } catch (e: any) {
      setError(e.message || "Failed to book cabin. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {data.pendingCheckout && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 rounded-full p-3 mt-1">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-indigo-900">You have a pending cabin checkout in progress!</h2>
              <p className="text-indigo-700 mt-1">
                You previously started a booking for <strong>Cabin {data.pendingCheckout.cabinInfo.cabinNum} (Floor {data.pendingCheckout.cabinInfo.floor})</strong> for the <strong>{data.pendingCheckout.type.replace('_', ' ')}</strong>. This cabin is temporarily reserved for you until you complete the payment.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <RazorpayCheckoutButton
                  type="cabin"
                  itemId={data.pendingCheckout.id}
                  itemName={`Cabin ${data.pendingCheckout.cabinInfo.cabinNum} (Floor ${data.pendingCheckout.cabinInfo.floor})`}
                  studentId={data.student.id}
                  studentName={data.student.name}
                  studentEmail={data.student.email || undefined}
                  studentPhone={data.student.phone}
                  totalFee={data.pendingCheckout.totalAmount}
                  paidAmount={0}
                  buttonText={`Complete Payment (₹${data.pendingCheckout.totalAmount / 100})`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                />
                <CancelBookingButton bookingId={data.pendingCheckout.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("transition-opacity", data.pendingCheckout && "opacity-40 pointer-events-none")}>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Study Cabins</h1>
        <p className="text-muted-foreground mt-2">Book a quiet, comfortable study space.</p>
      </div>

      {/* Pricing overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 text-center">
          <CalendarDays className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Reserved Cabin</h3>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">₹{data.pricing.reservedRate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">24/7 access</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 rounded-2xl p-6 text-center">
          <Clock className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Morning Shift</h3>
          <p className="text-2xl font-extrabold text-green-700 dark:text-green-400 mt-1">₹{data.pricing.morningShiftRate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">5am - 10am</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 rounded-2xl p-6 text-center">
          <Clock className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Day Shift</h3>
          <p className="text-2xl font-extrabold text-green-700 dark:text-green-400 mt-1">₹{data.pricing.dayShiftRate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10am - 5pm</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 rounded-2xl p-6 text-center">
          <Clock className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Night Shift</h3>
          <p className="text-2xl font-extrabold text-green-700 dark:text-green-400 mt-1">₹{data.pricing.nightShiftRate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">5pm - 12am</p>
        </div>
      </div>

      {/* Cabin features */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
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
          {data.floors.length > 1 && (
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
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-3">
          {!selectedCabin ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center h-[520px] flex flex-col items-center justify-center">
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
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
          <button
            type="button"
            onClick={() => setBookingType('reserved')}
            disabled={(selectedCabinInfo?.bookedShifts?.length ?? 0) > 0}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
              bookingType === 'reserved'
                ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              (selectedCabinInfo?.bookedShifts?.length ?? 0) > 0 ? 'opacity-50 cursor-not-allowed line-through' : ''
            )}
          >
            Reserved
          </button>
          <button
            type="button"
            onClick={() => setBookingType('morning_shift')}
            disabled={selectedCabinInfo?.bookedShifts?.includes('morning_shift')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
              bookingType === 'morning_shift'
                ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              selectedCabinInfo?.bookedShifts?.includes('morning_shift') ? 'opacity-50 cursor-not-allowed line-through' : ''
            )}
          >
            Morning
          </button>
          <button
            type="button"
            onClick={() => setBookingType('day_shift')}
            disabled={selectedCabinInfo?.bookedShifts?.includes('day_shift')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
              bookingType === 'day_shift'
                ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              selectedCabinInfo?.bookedShifts?.includes('day_shift') ? 'opacity-50 cursor-not-allowed line-through' : ''
            )}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setBookingType('night_shift')}
            disabled={selectedCabinInfo?.bookedShifts?.includes('night_shift')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
              bookingType === 'night_shift'
                ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              selectedCabinInfo?.bookedShifts?.includes('night_shift') ? 'opacity-50 cursor-not-allowed line-through' : ''
            )}
          >
            Night
          </button>
        </div>
      </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                    1 Month
                  </div>
                </div>
              </div>

              {/* Estimated Cost */}
              {estimatedAmount > 0 && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 rounded-xl p-4 mb-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Monthly Fee</span>
                      <span>{formatCurrency(estimatedAmount - (data.isFirstBooking ? data.pricing.registrationFee * 100 : 0))}</span>
                    </div>
                    {data.isFirstBooking && (
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Registration Fee (One-time)</span>
                        <span>{formatCurrency(data.pricing.registrationFee * 100)}</span>
                      </div>
                    )}
                    <div className="border-t border-green-200 dark:border-green-900/50 pt-2 flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Total Amount</span>
                      <span className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(estimatedAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-5 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* 10-Min Warning */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 mb-5 flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Clicking confirm will reserve this cabin for <strong>10 minutes</strong>. You must complete the payment within this time.
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleBook}
                size="lg"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base rounded-xl gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Booking Request
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
        cabin.isBookedByMe
          ? 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600 shadow-sm cursor-not-allowed'
          : cabin.isOccupied
          ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
          : isSelected
            ? 'bg-green-50 dark:bg-green-950/30 border-green-500 shadow-md shadow-green-100 dark:shadow-green-900/20'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50/30 dark:hover:bg-green-950/20'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors',
            cabin.isBookedByMe
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-200 dark:shadow-none'
              : cabin.isOccupied
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
            'text-[11px] transition-colors',
            cabin.isBookedByMe
              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60'
              : cabin.isOccupied
              ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-50'
              : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-50'
          )}
        >
          {cabin.isBookedByMe ? 'Your Booking' : cabin.isOccupied ? 'Occupied' : 'Available'}
        </Badge>
      </div>
      {!cabin.isOccupied && cabin.hourlyBookingsToday.length > 0 && (
        <div className="mt-2 pt-2 border-t border-green-100 dark:border-green-900/30">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Booked shifts today:</p>
          <div className="flex flex-wrap gap-1">
            {cabin.hourlyBookingsToday.map((h, i) => (
              <span key={i} className="text-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded capitalize">
                {h.type.replace('_', ' ')} ({h.startTime} - {h.endTime})
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
