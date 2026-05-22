'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';

export interface ReceiptData {
  receiptNo: string;
  studentName: string;
  studentPhone: string;
  // Booking-specific
  cabinNum?: number;
  bookingType?: string;
  bookingPeriod?: string;
  // Enrollment-specific
  courseName?: string;
  departmentName?: string;
  enrollmentPeriod?: string;
  // Common
  paymentType: 'booking' | 'enrollment';
  amount: number;
  mode: string;
  paidAt: string;
  notes?: string;
  businessName: string;
}

interface PaymentReceiptProps {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

function formatCurrency(amount: number): string {
  return `₹${(amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function PaymentReceipt({
  open,
  onClose,
  data,
}: PaymentReceiptProps) {
  const handlePrint = () => {
    if (!data) return;

    const isBooking = data.paymentType === 'booking';

    const detailRows = isBooking
      ? `
    <div class="row">
      <span class="label">Cabin:</span>
      <span class="value">${data.cabinNum || '—'}</span>
    </div>
    <div class="divider"></div>
    <div class="row">
      <span class="label">Booking Type:</span>
      <span class="value" style="text-transform:capitalize;">${data.bookingType || '—'}</span>
    </div>
    <div class="row">
      <span class="label">Period:</span>
      <span class="value">${data.bookingPeriod || '—'}</span>
    </div>`
      : `
    <div class="row">
      <span class="label">Course:</span>
      <span class="value">${data.courseName || '—'}</span>
    </div>
    <div class="row">
      <span class="label">Department:</span>
      <span class="value">${data.departmentName || '—'}</span>
    </div>
    ${data.enrollmentPeriod ? `<div class="row"><span class="label">Period:</span><span class="value">${data.enrollmentPeriod}</span></div>` : ''}`;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${data.receiptNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      max-width: 320px;
      margin: 0 auto;
      padding: 20px;
      color: #1a1a1a;
    }
    .receipt {
      border: 2px dashed #ea580c;
      padding: 16px;
      border-radius: 4px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #ea580c;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 16px;
      color: #ea580c;
      margin-bottom: 4px;
    }
    .header .receipt-no {
      font-size: 11px;
      color: #666;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
    }
    .row .label {
      color: #666;
    }
    .row .value {
      font-weight: bold;
      text-align: right;
    }
    .divider {
      border-top: 1px dashed #ccc;
      margin: 8px 0;
    }
    .amount-section {
      text-align: center;
      padding: 12px 0;
      margin: 8px 0;
      background: #fff7ed;
      border-radius: 4px;
    }
    .amount-section .amount {
      font-size: 24px;
      font-weight: bold;
      color: #ea580c;
    }
    .amount-section .label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .footer {
      text-align: center;
      border-top: 2px dashed #ea580c;
      padding-top: 12px;
      margin-top: 12px;
      font-size: 10px;
      color: #999;
    }
    .thank-you {
      font-size: 12px;
      color: #ea580c;
      margin-bottom: 4px;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${data.businessName}</h1>
      <div class="receipt-no">Receipt #${data.receiptNo}</div>
    </div>

    <div class="row">
      <span class="label">Student:</span>
      <span class="value">${data.studentName}</span>
    </div>
    <div class="row">
      <span class="label">Phone:</span>
      <span class="value">${data.studentPhone}</span>
    </div>

    <div class="divider"></div>

    ${detailRows}

    <div class="divider"></div>

    <div class="amount-section">
      <div class="label">Amount Paid</div>
      <div class="amount">${formatCurrency(data.amount)}</div>
    </div>

    <div class="row">
      <span class="label">Payment Mode:</span>
      <span class="value" style="text-transform:uppercase;">${data.mode}</span>
    </div>
    <div class="row">
      <span class="label">Date:</span>
      <span class="value">${formatDate(data.paidAt)}</span>
    </div>
    ${data.notes ? `<div class="row"><span class="label">Notes:</span><span class="value">${data.notes}</span></div>` : ''}

    <div class="footer">
      <div class="thank-you">Thank you for your payment!</div>
      <div>This is a computer-generated receipt</div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  if (!data) return null;

  const isBooking = data.paymentType === 'booking';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-cyan-600" />
              Payment Receipt
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Display */}
        <div className="font-mono text-sm border-2 border-dashed border-cyan-300 rounded-lg p-4 bg-cyan-50/30">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-cyan-300 pb-3 mb-3">
            <h3 className="text-base font-bold text-cyan-600">
              {data.businessName}
            </h3>
            <p className="text-xs text-gray-500">
              Receipt #{data.receiptNo}
            </p>
          </div>

          {/* Student Details */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Student:</span>
              <span className="font-semibold">{data.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span>{data.studentPhone}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Type-specific Details */}
          {isBooking ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Cabin:</span>
                <span>{data.cabinNum || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Type:</span>
                <span className="capitalize">{data.bookingType || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Period:</span>
                <span>{data.bookingPeriod || '—'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Course:</span>
                <span>{data.courseName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Department:</span>
                <span>{data.departmentName || '—'}</span>
              </div>
              {data.enrollmentPeriod && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Period:</span>
                  <span>{data.enrollmentPeriod}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Amount */}
          <div className="text-center py-3 bg-cyan-100 rounded-md my-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Amount Paid
            </p>
            <p className="text-2xl font-bold text-cyan-600">
              {formatCurrency(data.amount)}
            </p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Payment Details */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Mode:</span>
              <span className="uppercase">{data.mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span>{formatDate(data.paidAt)}</span>
            </div>
            {data.notes && (
              <div className="flex justify-between">
                <span className="text-gray-500">Notes:</span>
                <span>{data.notes}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-dashed border-cyan-300 mt-3 pt-3 text-center">
            <p className="text-cyan-600 text-xs font-semibold">
              Thank you for your payment!
            </p>
            <p className="text-xs text-gray-400">
              This is a computer-generated receipt
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
