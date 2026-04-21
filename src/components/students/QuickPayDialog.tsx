'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Banknote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuickPayStudent {
  id: string;
  name: string;
  phone: string;
}

interface QuickPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: QuickPayStudent | null;
  onSuccess: () => void;
}

interface Booking {
  id: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  cabin: { cabinNum: number };
  startDate: string;
  endDate?: string | null;
}

function formatCurrency(amount: number): string {
  return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuickPayDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: QuickPayDialogProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBookings, setFetchingBookings] = useState(false);

  useEffect(() => {
    if (open && student) {
      fetchBookings();
    }
  }, [open, student]);

  useEffect(() => {
    if (selectedBookingId) {
      const booking = bookings.find((b) => b.id === selectedBookingId);
      if (booking) {
        const pending = booking.totalAmount - booking.paidAmount;
        setAmount((pending / 100).toString());
      }
    }
  }, [selectedBookingId, bookings]);

  const fetchBookings = async () => {
    if (!student) return;
    setFetchingBookings(true);
    try {
      const res = await fetch(
        `/api/bookings?studentId=${student.id}&status=active`
      );
      const data = await res.json();
      if (data.bookings) {
        const pendingBookings = data.bookings.filter(
          (b: Booking) => b.totalAmount - b.paidAmount > 0
        );
        setBookings(pendingBookings);
        if (pendingBookings.length === 1) {
          setSelectedBookingId(pendingBookings[0].id);
        }
      }
    } catch {
      toast.error('Failed to fetch bookings');
    } finally {
      setFetchingBookings(false);
    }
  };

  const resetForm = () => {
    setSelectedBookingId('');
    setAmount('');
    setMode('cash');
    setNotes('');
    setBookings([]);
  };

  const handleSubmit = async () => {
    if (!student || !selectedBookingId || !amount || !mode) {
      toast.error('Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const selectedBooking = bookings.find((b) => b.id === selectedBookingId);
    if (selectedBooking) {
      const pendingAmount = (selectedBooking.totalAmount - selectedBooking.paidAmount) / 100;
      if (numAmount > pendingAmount) {
        toast.error(`Amount cannot exceed pending balance of ${formatCurrency(selectedBooking.totalAmount - selectedBooking.paidAmount)}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          bookingId: selectedBookingId,
          studentId: student.id,
          amount: numAmount,
          mode,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      toast.success('Payment recorded successfully!');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);
  const pendingAmount = selectedBooking
    ? selectedBooking.totalAmount - selectedBooking.paidAmount
    : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-orange-500" />
            Quick Pay
          </DialogTitle>
          <DialogDescription>Record a payment for this student</DialogDescription>
        </DialogHeader>

        {student && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
              <p className="font-semibold text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-600">{student.phone}</p>
            </div>

            {/* Booking Select */}
            <div className="space-y-2">
              <Label htmlFor="booking-select">Select Booking *</Label>
              {fetchingBookings ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading bookings...
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  No active bookings with pending amount
                </p>
              ) : (
                <Select
                  value={selectedBookingId}
                  onValueChange={setSelectedBookingId}
                >
                  <SelectTrigger id="booking-select">
                    <SelectValue placeholder="Select a booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        <span className="flex items-center gap-2">
                          Cabin {booking.cabin.cabinNum} •{' '}
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {booking.type}
                          </Badge>
                          • Pending:{' '}
                          {formatCurrency(booking.totalAmount - booking.paidAmount)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedBooking && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Amount:</span>
                  <span className="font-semibold text-orange-700">
                    {formatCurrency(pendingAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (₹) *</Label>
              <Input
                id="pay-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <Label>Payment Mode *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={mode === 'cash' ? 'default' : 'outline'}
                  className={
                    mode === 'cash'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : ''
                  }
                  onClick={() => setMode('cash')}
                >
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={mode === 'upi' ? 'default' : 'outline'}
                  className={
                    mode === 'upi'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : ''
                  }
                  onClick={() => setMode('upi')}
                >
                  UPI
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="pay-notes">Notes</Label>
              <Textarea
                id="pay-notes"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedBookingId || !amount}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Recording...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
