'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { ArrowLeft, Calendar, DoorOpen, IndianRupee, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { RazorpayCheckoutButton } from '@/components/payments/razorpay-checkout-button';
import { env } from '@/env';

function getBookingTypeLabel(type: string): string {
  switch (type) {
    case 'morning_shift': return 'Morning Shift (5AM - 10AM)';
    case 'day_shift': return 'Day Shift (10AM - 5PM)';
    case 'night_shift': return 'Night Shift (5PM - 12AM)';
    case 'reserved': return 'Exclusive Reserved';
    default: return type.replace('_', ' ');
  }
}

export default function ManageBookingClient({ booking, student }: { booking: any, student: any }) {
  const router = useRouter();
  const [isRenewing, setIsRenewing] = useState(false);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      const res = await fetch('/api/student/bookings/renew-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Failed to create renewal order');
        setIsRenewing(false);
        return;
      }

      const resLoaded = await loadRazorpay();
      if (!resLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your connection.');
        setIsRenewing(false);
        return;
      }

      const options = {
        key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount, // in paise
        currency: 'INR',
        name: 'Lamka Coaching Center',
        description: `Renewal for Cabin ${booking.cabin.cabinNum}`,
        order_id: data.orderId,
        prefill: {
          name: student.name,
          email: student.email,
          contact: student.phone,
        },
        handler: function (response: any) {
          toast.success('Payment successful! Your booking has been renewed.');
          setIsRenewing(false);
          router.refresh(); // Refresh page to see new endDate and payments
        },
        modal: {
          ondismiss: function () {
            setIsRenewing(false);
          }
        },
        theme: {
          color: '#0ea5e9'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      toast.error('Something went wrong during renewal.');
      setIsRenewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/my-learning">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Manage Cabin Booking</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <DoorOpen className="h-6 w-6 text-sky-500" />
                  Cabin {booking.cabin.cabinNum}
                </CardTitle>
                <CardDescription className="mt-1">
                  Floor {booking.cabin.floor}
                </CardDescription>
              </div>
              <Badge variant={booking.status === 'active' ? 'default' : 'outline'} className={booking.status === 'active' ? 'bg-emerald-600' : ''}>
                {booking.status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Booking Type</span>
                  <p className="font-medium">{getBookingTypeLabel(booking.type)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {booking.startDate ? formatDate(booking.startDate) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">End Date</span>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {booking.endDate ? formatDate(booking.endDate) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <p className="font-medium">
                    {booking.paidAmount >= booking.totalAmount ? (
                      <span className="text-emerald-600">Fully Paid</span>
                    ) : (
                      <span className="text-amber-600">Pending {formatCurrency(booking.totalAmount - booking.paidAmount)}</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payments made towards this booking.</CardDescription>
            </CardHeader>
            <CardContent>
              {booking.payments && booking.payments.length > 0 ? (
                <div className="space-y-4">
                  {booking.payments.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
                          <IndianRupee className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.receivedAt)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{payment.mode}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {booking.paidAmount < booking.totalAmount && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Pending Dues</CardTitle>
                <CardDescription className="text-amber-700">You have an outstanding balance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-amber-800">
                  Please clear your pending balance of <strong>{formatCurrency(booking.totalAmount - booking.paidAmount)}</strong> to avoid disruption.
                </p>
                <RazorpayCheckoutButton
                  type="cabin"
                  itemId={booking.cabin.id}
                  itemName={`Cabin ${booking.cabin.cabinNum} (Floor ${booking.cabin.floor})`}
                  studentId={student.id}
                  studentName={student.name}
                  studentEmail={student.email || undefined}
                  studentPhone={student.phone}
                  totalFee={booking.totalAmount}
                  paidAmount={booking.paidAmount}
                  buttonText="Settle Dues"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                />
              </CardContent>
            </Card>
          )}

          <Card className="bg-sky-50 border-sky-100">
            <CardHeader>
              <CardTitle className="text-sky-900">Renewal</CardTitle>
              <CardDescription className="text-sky-700">Extend your booking by 1 month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-sky-800">
                You can easily renew your cabin booking right here. 
                Your end date will be extended automatically upon successful payment.
              </p>
              <Button 
                onClick={handleRenew} 
                disabled={isRenewing || booking.status !== 'active'}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              >
                {isRenewing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew +1 Month
                  </>
                )}
              </Button>
              {booking.status !== 'active' && (
                <p className="text-xs text-red-500 mt-2 text-center">Only active bookings can be renewed.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
