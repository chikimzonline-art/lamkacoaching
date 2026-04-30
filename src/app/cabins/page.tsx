'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CabinInfo {
  id: string;
  cabinNum: number;
  notes: string | null;
  isOccupied: boolean;
  hourlyBookingsToday: { startTime: string; endTime: string }[];
  activeBookingsCount: number;
}

interface CabinData {
  cabins: CabinInfo[];
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

export default function CabinsPage() {
  const [data, setData] = useState<CabinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'hourly' | 'monthly'>('monthly');

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

  useEffect(() => {
    fetch('/api/public/cabins')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const availableCabins = data?.cabins.filter((c) => !c.isOccupied) || [];
  const selectedCabinInfo = data?.cabins.find((c) => c.id === selectedCabin);

  // Calculate estimated amount
  let estimatedAmount = 0;
  if (data && bookingType === 'hourly') {
    estimatedAmount = data.pricing.hourlyMonthlyRate * 100;
  } else if (data && bookingType === 'monthly') {
    estimatedAmount = data.pricing.monthlyRate * 100;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
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
        <section className="py-20 sm:py-28">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-5">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Booking Request Submitted!</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              Your cabin booking request has been received. We will contact you shortly to confirm your booking and arrange payment.
            </p>
            <div className="bg-green-50 border border-green-100 rounded-xl p-5 mb-6 text-left">
              <p className="text-sm text-green-800 font-medium mb-1">What happens next?</p>
              <ul className="text-sm text-green-700 space-y-1.5">
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
            Book a quiet, comfortable study space — hourly (5 hrs/day) or full-day monthly
          </p>
          {data && (
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-white/60">
              <span>{data.totalCabins} total cabins</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="text-green-200 font-semibold">{data.availableCabins} available now</span>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pricing overview */}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 text-lg">Hourly Booking</h3>
                <p className="text-3xl font-extrabold text-green-700 mt-1">₹{data.pricing.hourlyMonthlyRate}<span className="text-sm font-normal text-gray-500">/month</span></p>
                <p className="text-sm text-gray-500 mt-1">5 hours/day &bull; 1 month duration</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                <CalendarDays className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 text-lg">Monthly Booking</h3>
                <p className="text-3xl font-extrabold text-emerald-700 mt-1">₹{data.pricing.monthlyRate}<span className="text-sm font-normal text-gray-500">/month</span></p>
                <p className="text-sm text-gray-500 mt-1">Full-day access, best value for regular students</p>
              </div>
            </div>
          )}

          {/* Cabin features */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm text-gray-500">
            {[
              { icon: <Wifi className="h-4 w-4 text-green-600" />, text: 'Free Wi-Fi' },
              { icon: <AirVent className="h-4 w-4 text-green-600" />, text: 'Air Conditioned' },
              { icon: <Zap className="h-4 w-4 text-green-600" />, text: 'Power Outlets' },
              { icon: <ShieldCheck className="h-4 w-4 text-green-600" />, text: 'Secure Environment' },
            ].map((feat) => (
              <div key={feat.text} className="flex items-center gap-1.5">
                {feat.icon}
                <span className="font-medium text-gray-600">{feat.text}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Cabin Selection */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select a Cabin</h2>

              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && data && (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {data.cabins.map((cabin) => (
                    <button
                      key={cabin.id}
                      onClick={() => !cabin.isOccupied && setSelectedCabin(cabin.id)}
                      disabled={cabin.isOccupied}
                      className={cn(
                        'w-full text-left rounded-xl border-2 p-4 transition-all',
                        cabin.isOccupied
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                          : selectedCabin === cabin.id
                            ? 'bg-green-50 border-green-500 shadow-md shadow-green-100'
                            : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm',
                            cabin.isOccupied
                              ? 'bg-gray-200 text-gray-500'
                              : selectedCabin === cabin.id
                                ? 'bg-green-600 text-white'
                                : 'bg-green-100 text-green-700'
                          )}>
                            {cabin.cabinNum}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Cabin {cabin.cabinNum}</p>
                            {cabin.notes && (
                              <p className="text-xs text-gray-500">{cabin.notes}</p>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            'text-[11px]',
                            cabin.isOccupied
                              ? 'bg-red-50 text-red-600'
                              : 'bg-green-50 text-green-700'
                          )}
                        >
                          {cabin.isOccupied ? 'Occupied' : 'Available'}
                        </Badge>
                      </div>
                      {!cabin.isOccupied && cabin.hourlyBookingsToday.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-100">
                          <p className="text-[11px] text-gray-500 mb-1">Booked hours today:</p>
                          <div className="flex flex-wrap gap-1">
                            {cabin.hourlyBookingsToday.map((h, i) => (
                              <span key={i} className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                                {h.startTime} - {h.endTime}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Booking Form */}
            <div className="lg:col-span-3">
              {!selectedCabin ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
                  <DoorOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Select a Cabin</h3>
                  <p className="text-sm text-gray-500">Choose an available cabin from the list to start your booking</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedCabinInfo?.cabinNum}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Cabin {selectedCabinInfo?.cabinNum}</h3>
                      <p className="text-xs text-green-600 font-medium">Available for booking</p>
                    </div>
                  </div>

                  {/* Booking Type */}
                  <div className="mb-6">
                    <Label className="mb-2 block font-semibold text-gray-700">Booking Type</Label>
                    <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setBookingType('monthly')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                          bookingType === 'monthly'
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
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
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        <Clock className="h-4 w-4" />
                        Hourly
                      </button>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {bookingType === 'monthly' ? (
                      <>
                        <div>
                          <Label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-gray-700">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-sm font-medium text-gray-700">Duration</Label>
                          <div className="flex items-center h-9 px-3 rounded-md border bg-gray-50 text-sm text-gray-600">
                            1 Month (auto-renewable)
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="startDateH" className="mb-1.5 block text-sm font-medium text-gray-700">Start Date</Label>
                          <Input
                            id="startDateH"
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 block text-sm font-medium text-gray-700">Duration</Label>
                          <div className="flex items-center h-9 px-3 rounded-md border bg-gray-50 text-sm text-gray-600">
                            1 Month (5 hrs/day, auto-renewable)
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Personal Details */}
                  <div className="border-t border-gray-100 pt-5 mb-5">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Your Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Full Name *</Label>
                        <Input
                          id="name"
                          required
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number *</Label>
                        <Input
                          id="phone"
                          required
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">Address (optional)</Label>
                        <Input
                          id="address"
                          placeholder="Your address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estimated Cost */}
                  {estimatedAmount > 0 && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estimated Amount</span>
                        <span className="text-xl font-bold text-green-700">{formatCurrency(estimatedAmount)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Payment to be made at the center upon confirmation</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
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

                  <p className="text-xs text-gray-400 text-center mt-3">
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
