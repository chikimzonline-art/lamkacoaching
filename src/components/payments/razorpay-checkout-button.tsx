'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { processPayment } from '@/lib/razorpay';
import { enrollInCourse } from '@/app/(student)/dashboard/courses/actions';
import { revalidateDashboard } from '@/app/(student)/dashboard/actions';
import { Loader2, GraduationCap, Banknote, CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RazorpayCheckoutButtonProps {
  type: 'course' | 'cabin';
  itemId: string;
  itemName: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone: string;
  totalFee: number;
  paidAmount: number;
  isNewEnrollment?: boolean;
  batchId?: string;
  buttonText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function RazorpayCheckoutButton({
  type,
  itemId,
  itemName,
  studentId,
  studentName,
  studentEmail,
  studentPhone,
  totalFee,
  paidAmount,
  isNewEnrollment = false,
  batchId,
  buttonText = 'Pay Now',
  buttonVariant = 'default',
  className,
}: RazorpayCheckoutButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState<string>('');

  const pendingAmountPaise = totalFee - paidAmount;

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const handleOpen = () => {
    if (pendingAmountPaise <= 0) {
      toast.success('No pending dues for this item.');
      return;
    }
    setOpen(true);
  };

  const handlePay = async () => {
    let finalAmountPaise = pendingAmountPaise;
    if (paymentOption === 'partial') {
      const parsedAmountRupees = parseInt(customAmount, 10);
      if (isNaN(parsedAmountRupees) || parsedAmountRupees <= 0) {
        toast.error('Please enter a valid amount.');
        return;
      }
      
      const parsedAmountPaise = parsedAmountRupees * 100;
      
      if (parsedAmountPaise > pendingAmountPaise) {
        toast.error(`Amount cannot exceed the pending balance of ${formatCurrency(pendingAmountPaise)}`);
        return;
      }
      if (parsedAmountPaise < 50000) { // 500 rupees
        toast.error('Minimum payment amount is ₹500');
        return;
      }
      finalAmountPaise = parsedAmountPaise;
    }

    setLoading(true);

    try {
      // 1. If this is a brand new enrollment, we must create it in the database first
      if (isNewEnrollment) {
        if (type === 'course' && !batchId) {
          toast.error("Please select a batch first.");
          setLoading(false);
          return;
        }
        const res = await enrollInCourse(itemId, batchId || '');
        if (!res?.success) {
          // If already enrolled, the action returns an error. We can ignore it if we just want to proceed to pay,
          // but if it fails for another reason, we should stop.
          if (!res?.error?.includes('Already enrolled')) {
             throw new Error(res?.error || "Enrollment failed.");
          }
        }
      }

      // 2. Create Razorpay Order
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmountPaise, // already in paise
          notes: {
            studentId,
            type,
            itemId,
            batchId,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // 3. Open Razorpay Checkout Modal
      await processPayment({
        amount: finalAmountPaise,
        orderId: data.orderId,
        name: 'Lamka Coaching Center',
        description: `Payment for ${itemName}`,
        notes: {
          studentId,
          type,
          itemId,
        },
        prefill: {
          name: studentName,
          email: studentEmail || '',
          contact: studentPhone,
        },
        onSuccess: async (response: any) => {
          setOpen(false);
          toast.success('Payment successful!');
          try {
            await revalidateDashboard();
          } catch (e) {
            console.error('Failed to revalidate dashboard', e);
          }
          router.push(`/dashboard/success?type=${type}&id=${itemId}&payment_id=${response.razorpay_payment_id}`);
        },
        onFailure: (error) => {
          console.error('Payment failed', error);
          toast.error('Payment failed or was cancelled.');
          // Even if it failed, if it was a new enrollment, it's saved as pending_payment.
          if (isNewEnrollment) {
             setOpen(false);
             router.push('/dashboard/courses');
             toast.info('Enrollment saved. You can pay your dues later from the dashboard.');
          }
        },
      });
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during payment processing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant={buttonVariant}
        className={className}
        disabled={pendingAmountPaise <= 0}
      >
        {isNewEnrollment ? <GraduationCap className="h-4 w-4 mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
        {pendingAmountPaise <= 0 ? 'Fully Paid' : buttonText}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Complete Your Payment</DialogTitle>
            <DialogDescription>
              {itemName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Student Info Summary */}
            <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium">{studentPhone}</span>
              </div>
            </div>

            {/* Fee Summary */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-3">
                <Banknote className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Pending Dues</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(pendingAmountPaise)}</p>
                </div>
              </div>
              {paidAmount > 0 && (
                <div className="text-right text-xs text-blue-600">
                  Paid so far:<br/>{formatCurrency(paidAmount)}
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">How would you like to pay?</Label>
              <RadioGroup
                value={paymentOption}
                onValueChange={(val) => setPaymentOption(val as 'full' | 'partial')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="full" id="r1" />
                  <Label htmlFor="r1" className="flex-1 cursor-pointer">
                    <div className="font-medium">Pay Full Amount</div>
                    <div className="text-sm text-slate-500">Clear all pending dues ({formatCurrency(pendingAmountPaise)})</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="partial" id="r2" />
                  <Label htmlFor="r2" className="flex-1 cursor-pointer">
                    <div className="font-medium">Pay Custom Installment</div>
                    <div className="text-sm text-slate-500">Pay a portion now and clear the rest later</div>
                  </Label>
                </div>
              </RadioGroup>

              {paymentOption === 'partial' && (
                <div className="pt-2 pl-7 animate-in slide-in-from-top-2">
                  <Label htmlFor="customAmount" className="text-xs text-slate-500 mb-1 block">Enter Amount (₹)</Label>
                  <Input
                    id="customAmount"
                    type="number"
                    placeholder="e.g. 2000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min={500}
                    max={pendingAmountPaise / 100}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Minimum payment is ₹500.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proceed to Pay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
