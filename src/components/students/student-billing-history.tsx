"use client"

import { useState } from "react"
import { CreditCard, Receipt, FileText, Printer, Building2, BookOpen, ChevronRight, User, Phone, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/helpers"

export interface BusinessInfo {
  name: string
  address: string
  phone: string
  email: string
}

export interface ReceiptItemData {
  id: string
  type: "course" | "cabin"
  receiptNo: string
  transactionId?: string | null
  studentName: string
  studentPhone: string
  studentEmail?: string | null
  date: string
  amount: number
  mode: string
  status: string
  notes?: string | null
  // Course specific
  courseName?: string
  departmentName?: string
  batchName?: string
  courseTotalFee?: number
  coursePaidAmount?: number
  // Cabin specific
  cabinNum?: number
  floor?: number
  bookingType?: string
  bookingPeriod?: string
  cabinTotalFee?: number
  cabinPaidAmount?: number
}

interface StudentBillingHistoryProps {
  student: {
    id: string
    name: string
    phone: string
    email?: string | null
    payments: Array<{
      id: string
      amount: number
      mode: string
      status: string
      receivedAt: Date | string
      notes?: string | null
      receiptNo?: string | null
      transactionId?: string | null
      booking: {
        id: string
        cabin: {
          id: string
          cabinNum: number
          floor: number
        }
        type: string
        startDate: Date | string
        endDate?: Date | string | null
        startTime?: string | null
        endTime?: string | null
        totalAmount: number
        paidAmount: number
      }
    }>
    enrollmentPayments: Array<{
      id: string
      amount: number
      mode: string
      status: string
      receivedAt: Date | string
      notes?: string | null
      receiptNo?: string | null
      transactionId?: string | null
      enrollment: {
        id: string
        startDate: Date | string
        endDate?: Date | string | null
        totalFee: number
        paidAmount: number
        course: {
          id: string
          name: string
          department?: {
            id: string
            name: string
          } | null
        }
        batch?: {
          id: string
          name: string
          startTime?: string | null
          endTime?: string | null
        } | null
      }
    }>
  }
  businessInfo: BusinessInfo
}

function formatDate(dateInput: Date | string): string {
  try {
    const d = new Date(dateInput)
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return String(dateInput)
  }
}

function formatDateTime(dateInput: Date | string): string {
  try {
    const d = new Date(dateInput)
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return String(dateInput)
  }
}

export function StudentBillingHistory({ student, businessInfo }: StudentBillingHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItemData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openCourseReceipt = (payment: StudentBillingHistoryProps["student"]["enrollmentPayments"][0]) => {
    const receiptNumber = payment.receiptNo || `REC-C-${payment.id.slice(-6).toUpperCase()}`
    
    setSelectedReceipt({
      id: payment.id,
      type: "course",
      receiptNo: receiptNumber,
      transactionId: payment.transactionId,
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      date: formatDateTime(payment.receivedAt),
      amount: payment.amount,
      mode: payment.mode,
      status: payment.status,
      notes: payment.notes,
      courseName: payment.enrollment.course.name,
      departmentName: payment.enrollment.course.department?.name,
      batchName: payment.enrollment.batch?.name,
      courseTotalFee: payment.enrollment.totalFee,
      coursePaidAmount: payment.enrollment.paidAmount,
    })
    setModalOpen(true)
  }

  const openCabinReceipt = (payment: StudentBillingHistoryProps["student"]["payments"][0]) => {
    const receiptNumber = payment.receiptNo || `REC-B-${payment.id.slice(-6).toUpperCase()}`
    
    let period = formatDate(payment.booking.startDate)
    if (payment.booking.endDate) {
      period += ` - ${formatDate(payment.booking.endDate)}`
    }
    if (payment.booking.startTime && payment.booking.endTime) {
      period += ` (${payment.booking.startTime} - ${payment.booking.endTime})`
    }

    setSelectedReceipt({
      id: payment.id,
      type: "cabin",
      receiptNo: receiptNumber,
      transactionId: payment.transactionId,
      studentName: student.name,
      studentPhone: student.phone,
      studentEmail: student.email,
      date: formatDateTime(payment.receivedAt),
      amount: payment.amount,
      mode: payment.mode,
      status: payment.status,
      notes: payment.notes,
      cabinNum: payment.booking.cabin.cabinNum,
      floor: payment.booking.cabin.floor,
      bookingType: payment.booking.type,
      bookingPeriod: period,
      cabinTotalFee: payment.booking.totalAmount,
      cabinPaidAmount: payment.booking.paidAmount,
    })
    setModalOpen(true)
  }

  const handlePrint = () => {
    if (!selectedReceipt) return

    const isBooking = selectedReceipt.type === "cabin"
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${selectedReceipt.receiptNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      max-width: 420px;
      margin: 0 auto;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
    }
    .receipt-container {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .receipt-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #059669;
      background: #ecfdf5;
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      margin-top: 8px;
    }
    .receipt-no {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;
    }
    .row .label {
      color: #64748b;
    }
    .row .value {
      font-weight: 600;
      text-align: right;
      color: #0f172a;
    }
    .divider {
      border-top: 1px dashed #e2e8f0;
      margin: 12px 0;
    }
    .amount-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      margin: 12px 0;
    }
    .amount-box .label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #166534;
    }
    .amount-box .amount {
      font-size: 24px;
      font-weight: 800;
      color: #15803d;
      margin-top: 2px;
    }
    .footer {
      text-align: center;
      border-top: 2px dashed #cbd5e1;
      padding-top: 14px;
      margin-top: 16px;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.4;
    }
    .footer strong {
      color: #64748b;
    }
    @media print {
      body { padding: 0; }
      .receipt-container { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="brand-title">${businessInfo.name}</div>
      <div class="brand-sub">${businessInfo.address}</div>
      <div class="brand-sub">${businessInfo.phone} • ${businessInfo.email}</div>
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-no">Receipt #: ${selectedReceipt.receiptNo}</div>
    </div>

    <div class="section-title">Student Information</div>
    <div class="row">
      <span class="label">Name:</span>
      <span class="value">${selectedReceipt.studentName}</span>
    </div>
    <div class="row">
      <span class="label">Phone:</span>
      <span class="value">${selectedReceipt.studentPhone}</span>
    </div>
    ${selectedReceipt.studentEmail ? `
    <div class="row">
      <span class="label">Email:</span>
      <span class="value">${selectedReceipt.studentEmail}</span>
    </div>` : ""}

    <div class="divider"></div>

    <div class="section-title">Particulars</div>
    ${isBooking ? `
    <div class="row">
      <span class="label">Cabin Number:</span>
      <span class="value">Cabin ${selectedReceipt.cabinNum} (Floor ${selectedReceipt.floor})</span>
    </div>
    <div class="row">
      <span class="label">Booking Type:</span>
      <span class="value" style="text-transform: capitalize;">${selectedReceipt.bookingType?.replace("_", " ") || "Standard"}</span>
    </div>
    <div class="row">
      <span class="label">Duration / Period:</span>
      <span class="value">${selectedReceipt.bookingPeriod || "—"}</span>
    </div>
    ` : `
    <div class="row">
      <span class="label">Course:</span>
      <span class="value">${selectedReceipt.courseName || "—"}</span>
    </div>
    ${selectedReceipt.departmentName ? `
    <div class="row">
      <span class="label">Department:</span>
      <span class="value">${selectedReceipt.departmentName}</span>
    </div>` : ""}
    ${selectedReceipt.batchName ? `
    <div class="row">
      <span class="label">Batch:</span>
      <span class="value">${selectedReceipt.batchName}</span>
    </div>` : ""}
    `}

    <div class="amount-box">
      <div class="label">Amount Paid</div>
      <div class="amount">${formatCurrency(selectedReceipt.amount)}</div>
    </div>

    <div class="section-title">Transaction Details</div>
    <div class="row">
      <span class="label">Payment Date:</span>
      <span class="value">${selectedReceipt.date}</span>
    </div>
    <div class="row">
      <span class="label">Payment Mode:</span>
      <span class="value" style="text-transform: uppercase;">${selectedReceipt.mode}</span>
    </div>
    <div class="row">
      <span class="label">Status:</span>
      <span class="value" style="color: #15803d; text-transform: uppercase;">${selectedReceipt.status}</span>
    </div>
    ${selectedReceipt.transactionId ? `
    <div class="row">
      <span class="label">Transaction ID:</span>
      <span class="value" style="font-family: monospace; font-size: 11px;">${selectedReceipt.transactionId}</span>
    </div>` : ""}
    ${selectedReceipt.notes ? `
    <div class="row">
      <span class="label">Remarks:</span>
      <span class="value">${selectedReceipt.notes}</span>
    </div>` : ""}

    <div class="footer">
      <strong>Thank you for your payment!</strong><br />
      This is an official computer-generated receipt.
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
`
    const printWindow = window.open("", "_blank", "width=480,height=680")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  const enrollmentPayments = student.enrollmentPayments || []
  const cabinPayments = student.payments || []

  return (
    <>
      <Tabs defaultValue="courses" className="w-full space-y-6">
        <TabsList className="bg-slate-100/90 p-1.5 rounded-2xl h-auto flex w-full max-w-md border border-slate-200/80 shadow-xs">
          <TabsTrigger
            value="courses"
            className="flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Course Payments</span>
            {enrollmentPayments.length > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 font-bold text-slate-600 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                {enrollmentPayments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="cabins"
            className="flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span>Cabin Payments</span>
            {cabinPayments.length > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 font-bold text-slate-600 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                {cabinPayments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Course Payments */}
        <TabsContent value="courses" className="focus-visible:outline-none">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg text-slate-900 font-bold">Course Transaction History</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Click any transaction below to view or print your official payment receipt.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {enrollmentPayments.length > 0 ? (
                <div>
                  {/* Mobile Stacked Card View (md:hidden) */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {enrollmentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        onClick={() => openCourseReceipt(payment)}
                        className="p-4 space-y-2.5 active:bg-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                              <Receipt className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">
                                {payment.enrollment.course.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {formatDateTime(payment.receivedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600 text-base">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                              {payment.mode}
                            </span>
                            <Badge
                              variant={payment.status === "completed" ? "default" : "secondary"}
                              className={payment.status === "completed" ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <span className="text-xs font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            View Receipt <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden md:block) */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200/80">
                          <TableHead className="font-semibold text-xs text-slate-600 pl-6">Date & Time</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Course & Details</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Payment Mode</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Status</TableHead>
                          <TableHead className="text-right font-semibold text-xs text-slate-600">Amount Paid</TableHead>
                          <TableHead className="text-right font-semibold text-xs text-slate-600 pr-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollmentPayments.map((payment) => (
                          <TableRow
                            key={payment.id}
                            onClick={() => openCourseReceipt(payment)}
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                          >
                            <TableCell className="font-medium whitespace-nowrap text-xs text-slate-700 pl-6">
                              {formatDateTime(payment.receivedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 shrink-0 group-hover:bg-emerald-100 transition-colors">
                                  <Receipt className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="font-semibold text-xs text-slate-900 group-hover:text-primary transition-colors">
                                    {payment.enrollment.course.name}
                                  </p>
                                  {payment.enrollment.course.department && (
                                    <p className="text-[11px] text-slate-400">
                                      {payment.enrollment.course.department.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="uppercase text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {payment.mode}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={payment.status === "completed" ? "default" : "secondary"}
                                className={payment.status === "completed" ? "bg-emerald-600 text-white text-[11px]" : "text-[11px]"}
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-sm">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs font-semibold text-slate-600 group-hover:text-primary group-hover:bg-primary/10 gap-1 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openCourseReceipt(payment)
                                }}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View Receipt
                                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <CreditCard className="h-10 w-10 mb-3 text-slate-300" />
                  <p className="font-medium text-slate-700 text-sm">No course payment records found.</p>
                  <p className="text-xs text-slate-400 mt-1">Receipts will appear here once fees are processed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Cabin Payments */}
        <TabsContent value="cabins" className="focus-visible:outline-none">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg text-slate-900 font-bold">Cabin Transaction History</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Click any transaction below to view or print your official booking receipt.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cabinPayments.length > 0 ? (
                <div>
                  {/* Mobile Stacked Card View (md:hidden) */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {cabinPayments.map((payment) => (
                      <div
                        key={payment.id}
                        onClick={() => openCabinReceipt(payment)}
                        className="p-4 space-y-2.5 active:bg-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                              <Receipt className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">
                                Cabin {payment.booking.cabin.cabinNum} (Floor {payment.booking.cabin.floor})
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {formatDateTime(payment.receivedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600 text-base">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                              {payment.mode}
                            </span>
                            <Badge
                              variant={payment.status === "completed" ? "default" : "secondary"}
                              className={payment.status === "completed" ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <span className="text-xs font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            View Receipt <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden md:block) */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200/80">
                          <TableHead className="font-semibold text-xs text-slate-600 pl-6">Date & Time</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Cabin & Details</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Payment Mode</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Status</TableHead>
                          <TableHead className="text-right font-semibold text-xs text-slate-600">Amount Paid</TableHead>
                          <TableHead className="text-right font-semibold text-xs text-slate-600 pr-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cabinPayments.map((payment) => (
                          <TableRow
                            key={payment.id}
                            onClick={() => openCabinReceipt(payment)}
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                          >
                            <TableCell className="font-medium whitespace-nowrap text-xs text-slate-700 pl-6">
                              {formatDateTime(payment.receivedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 shrink-0 group-hover:bg-emerald-100 transition-colors">
                                  <Building2 className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="font-semibold text-xs text-slate-900 group-hover:text-primary transition-colors">
                                    Cabin {payment.booking.cabin.cabinNum} (Floor {payment.booking.cabin.floor})
                                  </p>
                                  <p className="text-[11px] text-slate-400 capitalize">
                                    {payment.booking.type.replace("_", " ")} Booking
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="uppercase text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {payment.mode}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={payment.status === "completed" ? "default" : "secondary"}
                                className={payment.status === "completed" ? "bg-emerald-600 text-white text-[11px]" : "text-[11px]"}
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-sm">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs font-semibold text-slate-600 group-hover:text-primary group-hover:bg-primary/10 gap-1 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openCabinReceipt(payment)
                                }}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View Receipt
                                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <CreditCard className="h-10 w-10 mb-3 text-slate-300" />
                  <p className="font-medium text-slate-700 text-sm">No cabin payment records found.</p>
                  <p className="text-xs text-slate-400 mt-1">Receipts will appear here once booking payments are processed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl">
          {selectedReceipt && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-white tracking-tight">
                        Payment Receipt
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-300 mt-0.5">
                        {businessInfo.name}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5">
                      Completed
                    </Badge>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      {selectedReceipt.receiptNo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Receipt Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                {/* Student Info Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                    Billed To
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {selectedReceipt.studentName}
                    </div>
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {selectedReceipt.studentPhone}
                    </div>
                  </div>
                  {selectedReceipt.studentEmail && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {selectedReceipt.studentEmail}
                    </div>
                  )}
                </div>

                {/* Particulars Card */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                    Particulars & Item Details
                  </p>

                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                          {selectedReceipt.type === "cabin" ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <BookOpen className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {selectedReceipt.type === "cabin"
                              ? `Cabin ${selectedReceipt.cabinNum} (Floor ${selectedReceipt.floor})`
                              : selectedReceipt.courseName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedReceipt.type === "cabin"
                              ? `${selectedReceipt.bookingType?.replace("_", " ").toUpperCase()} BOOKING`
                              : selectedReceipt.departmentName || "Course Fee"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedReceipt.bookingPeriod && (
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Duration / Schedule</span>
                        <span className="font-medium text-slate-800">{selectedReceipt.bookingPeriod}</span>
                      </div>
                    )}

                    {selectedReceipt.batchName && (
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Assigned Batch</span>
                        <span className="font-medium text-slate-800">{selectedReceipt.batchName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Paid Box */}
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-center">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total Amount Paid
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {formatCurrency(selectedReceipt.amount)}
                  </p>
                  <p className="text-[11px] text-emerald-700/80 mt-1">
                    Payment successfully processed and verified
                  </p>
                </div>

                {/* Transaction Metadata */}
                <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Date & Time</span>
                    <span className="font-semibold text-slate-800">{selectedReceipt.date}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Payment Mode</span>
                    <span className="font-semibold uppercase text-slate-800">{selectedReceipt.mode}</span>
                  </div>
                  {selectedReceipt.transactionId && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="font-mono font-semibold text-slate-800 text-[11px]">{selectedReceipt.transactionId}</span>
                    </div>
                  )}
                  {selectedReceipt.notes && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Notes / Remarks</span>
                      <span className="text-slate-800">{selectedReceipt.notes}</span>
                    </div>
                  )}
                </div>

                {/* Institutional Footer */}
                <div className="text-center pt-2 text-[11px] text-slate-400 space-y-0.5">
                  <p className="font-semibold text-slate-600">{businessInfo.name}</p>
                  <p>{businessInfo.address}</p>
                  <p>{businessInfo.phone} • {businessInfo.email}</p>
                  <p className="pt-2 italic text-[10px] text-slate-400">
                    This is an official computer-generated receipt and requires no physical signature.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl text-xs font-semibold h-10 px-4"
                >
                  Close
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-10 px-5 gap-2 shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
