'use client';

import { useState, useEffect } from 'react';
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
  ScanLine,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const QrScannerModal = dynamic(() => import('@/components/attendance/qr-scanner-modal'), { ssr: false });
import { cn } from '@/lib/utils';
import { bookCabin, cancelCabinBooking } from './actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { processPayment } from '@/lib/razorpay';
import { RazorpayCheckoutButton } from '@/components/payments/razorpay-checkout-button';
import { CancelBookingButton } from '@/components/bookings/cancel-booking-button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CabinInfo {
  id: string;
  floor: number;
  cabinNum: number;
  notes: string | null;
  isOccupied: boolean;
  isBookedByMe?: boolean;
  bookedShifts: string[];
  activeShiftsToday: { startTime: string; endTime: string, type: string }[];
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [bookingType, setBookingType] = useState<'reserved' | 'morning_shift' | 'day_shift' | 'night_shift'>('reserved');
  const [activeFloor, setActiveFloor] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const handleDeskQrScan = async (scannedValue: string) => {
    try {
      const res = await fetch('/api/attendance/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          deskQrPayload: scannedValue,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || 'Check-in failed');
        return;
      }
      toast.success(resData.message || 'Checked in successfully!');
      router.refresh();
    } catch {
      toast.error('Failed to log attendance');
    }
  };
  const router = useRouter();

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleSelectCabin = (cabinId: string) => {
    setSelectedCabin(cabinId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileDrawerOpen(true);
    }
  };

  async function handleBook() {
    if (!selectedCabin) return;
    setError('');
    setSubmitting(true);
    let createdBookingId: string | null = null;
    
    try {
      // 1. Create the booking record (status: pending_payment)
      const res = await bookCabin(selectedCabin, bookingType, startDate);
      if (!res?.success || !res?.bookingId) {
        throw new Error(res?.error || "Failed to reserve cabin");
      }
      createdBookingId = res.bookingId;

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

      // 3. Close the mobile drawer BEFORE launching Razorpay
      // Crucial: Releases Radix UI's pointer-events lock and focus-trap so Razorpay iframe is fully interactive
      setMobileDrawerOpen(false);

      // 4. Launch Razorpay Checkout
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
        onFailure: async (err) => {
          console.error("Payment failed or cancelled", err);
          // If the user cancelled or exited, instantly discard the draft booking to free the cabin
          if (createdBookingId) {
            try {
              await cancelCabinBooking(createdBookingId);
              toast.info("Cabin reservation cancelled. You can select any available cabin.");
            } catch (cancelErr) {
              console.error("Failed to auto-cancel cabin booking", cancelErr);
            }
            router.refresh();
          } else {
            setError(err.message || "Payment failed or was cancelled.");
          }
          setSubmitting(false);
        },
      });
    } catch (e: any) {
      if (createdBookingId) {
        try {
          await cancelCabinBooking(createdBookingId);
        } catch (cancelErr) {
          console.error("Failed to auto-cancel cabin booking after error", cancelErr);
        }
      }
      setError(e.message || "Failed to book cabin. Please try again.");
      setSubmitting(false);
    }
  }

  const renderBookingFormContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
          {selectedCabinInfo?.cabinNum}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            Cabin {selectedCabinInfo?.cabinNum}
            <span className="ml-2 text-xs sm:text-sm font-normal text-slate-500">
              on {selectedCabinInfo ? formatFloorLabel(selectedCabinInfo.floor) : ''}
            </span>
          </h3>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <Building2 className="h-3.5 w-3.5" />
            {selectedCabinInfo ? formatFloorLabel(selectedCabinInfo.floor) : ''} &bull; Available
          </p>
        </div>
      </div>

      {/* Booking Type / Shift Selection */}
      <div>
        <Label className="mb-2 block font-semibold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">
          Select Shift
        </Label>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/80 p-1.5 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setBookingType('reserved')}
            disabled={(selectedCabinInfo?.bookedShifts?.length ?? 0) > 0}
            className={cn(
              'flex flex-col items-center justify-center p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              bookingType === 'reserved'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900',
              (selectedCabinInfo?.bookedShifts?.length ?? 0) > 0 ? 'opacity-40 cursor-not-allowed line-through' : ''
            )}
          >
            <span>Exclusive Reserved</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5">24/7 Access</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('morning_shift')}
            disabled={selectedCabinInfo?.bookedShifts?.includes('morning_shift')}
            className={cn(
              'flex flex-col items-center justify-center p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              bookingType === 'morning_shift'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900',
              selectedCabinInfo?.bookedShifts?.includes('morning_shift') ? 'opacity-40 cursor-not-allowed line-through' : ''
            )}
          >
            <span>Morning Shift</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5">5AM - 10AM</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('day_shift')}
            disabled={selectedCabinInfo?.bookedShifts?.includes('day_shift')}
            className={cn(
              'flex flex-col items-center justify-center p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              bookingType === 'day_shift'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900',
              selectedCabinInfo?.bookedShifts?.includes('day_shift') ? 'opacity-40 cursor-not-allowed line-through' : ''
            )}
          >
            <span>Day Shift</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5">10AM - 5PM</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('night_shift')}
            disabled={selectedCabinInfo?.bookedShifts?.includes('night_shift')}
            className={cn(
              'flex flex-col items-center justify-center p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              bookingType === 'night_shift'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900',
              selectedCabinInfo?.bookedShifts?.includes('night_shift') ? 'opacity-40 cursor-not-allowed line-through' : ''
            )}
          >
            <span>Night Shift</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5">5PM - 12AM</span>
          </button>
        </div>
      </div>

      {/* Date & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate" className="mb-1.5 block text-xs font-semibold text-slate-700">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="rounded-xl border-slate-200"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Duration</Label>
          <div className="flex items-center h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
            1 Month (Auto-Renewable)
          </div>
        </div>
      </div>

      {/* Estimated Cost */}
      {estimatedAmount > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Monthly Shift Fee</span>
              <span className="font-semibold text-slate-800">{formatCurrency(estimatedAmount - (data.isFirstBooking ? data.pricing.registrationFee * 100 : 0))}</span>
            </div>
            {data.isFirstBooking && (
              <div className="flex justify-between text-xs text-slate-600">
                <span>One-Time Registration Fee</span>
                <span className="font-semibold text-slate-800">{formatCurrency(data.pricing.registrationFee * 100)}</span>
              </div>
            )}
            <div className="border-t border-emerald-200 pt-2.5 flex items-center justify-between mt-1">
              <span className="font-bold text-slate-900 text-sm">Total Due Today</span>
              <span className="text-xl font-extrabold text-emerald-700">{formatCurrency(estimatedAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* 10-Minute Hold Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
        <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p>Reserves this cabin temporarily for <strong>10 minutes</strong> while you complete payment.</p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleBook}
        size="lg"
        disabled={submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 text-sm rounded-xl gap-2 shadow-xs cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reserving & Launching Payment...
          </>
        ) : (
          <>
            Proceed to Payment ({formatCurrency(estimatedAmount)})
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {data.pendingCheckout && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs mb-6">
          <div className="flex items-start gap-3.5">
            <div className="bg-amber-100 rounded-xl p-2.5 mt-0.5">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-bold text-amber-950">You have a pending cabin checkout in progress!</h2>
              <p className="text-amber-800 text-xs sm:text-sm mt-1">
                You previously started booking <strong>Cabin {data.pendingCheckout.cabinInfo.cabinNum} (Floor {data.pendingCheckout.cabinInfo.floor})</strong> for the <strong>{data.pendingCheckout.type.replace('_', ' ')}</strong>.
              </p>
              
              <div className="flex flex-wrap gap-3 mt-4">
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
                  buttonText={`Complete Payment (${formatCurrency(data.pendingCheckout.totalAmount)})`}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9"
                />
                <CancelBookingButton bookingId={data.pendingCheckout.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className={cn("transition-opacity", data.pendingCheckout && "opacity-40 pointer-events-none")}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Study Cabins</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1.5">Book a quiet, personal study space with high-speed Wi-Fi and AC.</p>
        </div>
        <Button
          onClick={() => setScanModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium gap-2 shadow-sm rounded-xl h-10 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <ScanLine className="h-4 w-4" />
          Scan Desk QR to Check In
        </Button>
      </div>

      {/* Pricing overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 text-center shadow-xs">
          <CalendarDays className="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Reserved</h3>
          <p className="text-lg sm:text-2xl font-bold text-emerald-700 mt-0.5">₹{data.pricing.reservedRate}<span className="text-xs font-normal text-slate-500">/mo</span></p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">24/7 access</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <Clock className="h-5 w-5 text-slate-600 mx-auto mb-1.5" />
          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Morning Shift</h3>
          <p className="text-lg sm:text-2xl font-bold text-slate-800 mt-0.5">₹{data.pricing.morningShiftRate}<span className="text-xs font-normal text-slate-500">/mo</span></p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">5am - 10am</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <Clock className="h-5 w-5 text-slate-600 mx-auto mb-1.5" />
          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Day Shift</h3>
          <p className="text-lg sm:text-2xl font-bold text-slate-800 mt-0.5">₹{data.pricing.dayShiftRate}<span className="text-xs font-normal text-slate-500">/mo</span></p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">10am - 5pm</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <Clock className="h-5 w-5 text-slate-600 mx-auto mb-1.5" />
          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Night Shift</h3>
          <p className="text-lg sm:text-2xl font-bold text-slate-800 mt-0.5">₹{data.pricing.nightShiftRate}<span className="text-xs font-normal text-slate-500">/mo</span></p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">5pm - 12am</p>
        </div>
      </div>

      {/* Cabin features */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
        {[
          { icon: <Wifi className="h-4 w-4 text-emerald-600" />, text: 'High-speed Wi-Fi' },
          { icon: <AirVent className="h-4 w-4 text-emerald-600" />, text: 'Air Conditioned' },
          { icon: <Zap className="h-4 w-4 text-emerald-600" />, text: 'Dedicated Power Socket' },
          { icon: <ShieldCheck className="h-4 w-4 text-emerald-600" />, text: 'CCTV Monitored' },
        ].map((feat) => (
          <div key={feat.text} className="flex items-center gap-1.5">
            {feat.icon}
            <span className="font-medium">{feat.text}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Left / Full: Cabin Selection */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Select an Available Cabin</h2>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {availableCabins.length} Available
            </span>
          </div>

          {/* Floor Tabs */}
          {data.floors.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setActiveFloor('all')}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                  activeFloor === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
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
                      'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                      activeFloor === fg.floor
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Building2 className="h-3 w-3" />
                    {fg.label}
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full',
                      activeFloor === fg.floor
                        ? 'bg-white/20 text-white'
                        : availCount > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                    )}>
                      {availCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {/* Group by floor when showing all floors */}
            {activeFloor === 'all' && data.floors.length > 1 ? (
              data.cabinsByFloor.map((fg) => (
                <div key={fg.floor}>
                  <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{fg.label}</span>
                    <Badge variant="outline" className="text-[10px] text-slate-500">
                      {fg.cabins.filter((c) => !c.isOccupied).length} available
                    </Badge>
                  </div>
                  {fg.cabins.map((cabin) => (
                    <CabinListItem
                      key={cabin.id}
                      cabin={cabin}
                      isSelected={selectedCabin === cabin.id}
                      showFloorLabel={false}
                      onSelect={() => !cabin.isOccupied && handleSelectCabin(cabin.id)}
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
                  onSelect={() => !cabin.isOccupied && handleSelectCabin(cabin.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Desktop Booking Form Panel (hidden on mobile, uses bottom sheet instead) */}
        <div className="hidden lg:block lg:col-span-3">
          {!selectedCabin ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center h-[520px] flex flex-col items-center justify-center shadow-xs">
              <DoorOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Select a Cabin</h3>
              <p className="text-xs text-slate-500 max-w-xs">Choose an available cabin from the left list to configure your shift and proceed to booking.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
              {renderBookingFormContent()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Up Bottom Sheet Drawer for Booking Form */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="bottom" className="lg:hidden rounded-t-3xl border-t border-slate-200 bg-white p-6 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-2 text-left">
            <SheetTitle className="text-base font-bold text-slate-900">Cabin Reservation</SheetTitle>
          </SheetHeader>
          {selectedCabinInfo && renderBookingFormContent()}
        </SheetContent>
      </Sheet>

      {/* Desk QR Check-In Scanner Modal */}
      <QrScannerModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScan={handleDeskQrScan}
        title="Scan Cabin Desk QR"
        hint="Point camera at the QR code sticker on your cabin desk"
      />
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
      {!cabin.isOccupied && cabin.activeShiftsToday.length > 0 && (
        <div className="mt-2 pt-2 border-t border-green-100 dark:border-green-900/30">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Booked shifts today:</p>
          <div className="flex flex-wrap gap-1">
            {cabin.activeShiftsToday.map((h, i) => (
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
