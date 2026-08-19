import { requireStudent } from "@/lib/student-auth"
import { AlertCircle, CreditCard, Receipt, FileText, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/helpers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button"

export default async function DashboardHistoryPage() {
  const { student } = await requireStudent()

  // Calculate pending items
  const pendingEnrollments = student.enrollments.filter(e => e.status === "pending_payment" || (e.totalFee - e.paidAmount > 0))
  const pendingBookings = student.bookings.filter(b => (b.totalAmount - b.paidAmount > 0))

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Billing & History</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5">View your pending dues and past transaction receipts.</p>
      </div>

      {/* Unpaid Dues Section */}
      {(pendingEnrollments.length > 0 || pendingBookings.length > 0) && (
        <Card className="border-red-200 bg-red-50/60 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-red-900 text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" /> Pending Dues
            </CardTitle>
            <CardDescription className="text-red-700 text-xs sm:text-sm">
              Please settle these pending balances to prevent any interruption in your courses or cabin access.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
             <div className="space-y-3">
              {pendingEnrollments.map(enrollment => (
                <div key={enrollment.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 border border-red-100 rounded-xl shadow-xs gap-3">
                  <div className="flex items-start gap-3">
                     <div className="rounded-xl bg-red-50 p-2.5 text-red-600 shrink-0 mt-0.5">
                       <FileText className="h-5 w-5" />
                     </div>
                     <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">{enrollment.course.name}</h3>
                      <p className="text-xs text-slate-500">Course Fee Balance</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="font-extrabold text-red-600 text-base sm:text-lg">{formatCurrency(enrollment.totalFee - enrollment.paidAmount)}</p>
                      <p className="text-[11px] text-slate-400">Total: {formatCurrency(enrollment.totalFee)}</p>
                    </div>
                    <RazorpayCheckoutButton
                      type="course"
                      itemId={enrollment.course.id}
                      itemName={enrollment.course.name}
                      studentId={student.id}
                      studentName={student.name}
                      studentEmail={student.email || undefined}
                      studentPhone={student.phone}
                      totalFee={enrollment.totalFee}
                      paidAmount={enrollment.paidAmount}
                      buttonText="Pay Now"
                      buttonVariant="destructive"
                      className="h-9 text-xs font-semibold px-4 rounded-xl shadow-xs"
                    />
                  </div>
                </div>
              ))}
              {pendingBookings.map(booking => (
                <div key={booking.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 border border-red-100 rounded-xl shadow-xs gap-3">
                  <div className="flex items-start gap-3">
                     <div className="rounded-xl bg-red-50 p-2.5 text-red-600 shrink-0 mt-0.5">
                       <Receipt className="h-5 w-5" />
                     </div>
                     <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Cabin {booking.cabin.cabinNum} (Floor {booking.cabin.floor})</h3>
                      <p className="text-xs text-slate-500 capitalize">{booking.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="font-extrabold text-red-600 text-base sm:text-lg">{formatCurrency(booking.totalAmount - booking.paidAmount)}</p>
                      <p className="text-[11px] text-slate-400">Total: {formatCurrency(booking.totalAmount)}</p>
                    </div>
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
                      buttonText="Pay Now"
                      buttonVariant="destructive"
                      className="h-9 text-xs font-semibold px-4 rounded-xl shadow-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segmented Tabs */}
      <Tabs defaultValue="courses" className="w-full space-y-6">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto flex w-full max-w-md border border-slate-200/60">
          <TabsTrigger 
            value="courses"
            className="flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
          >
            Course Payments
          </TabsTrigger>
          <TabsTrigger 
            value="cabins"
            className="flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
          >
            Cabin Payments
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Course Payments */}
        <TabsContent value="courses" className="focus-visible:outline-none">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base sm:text-lg text-slate-900">Course Transaction History</CardTitle>
              <CardDescription className="text-xs sm:text-sm">A complete chronological log of all your course fee payments.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {student?.enrollmentPayments && student.enrollmentPayments.length > 0 ? (
                <div>
                  {/* Mobile Stacked Card View (md:hidden) */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {student.enrollmentPayments.map(payment => (
                      <div key={payment.id} className="p-4 space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{payment.enrollment.course.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(payment.receivedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600 text-base">{formatCurrency(payment.amount)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 text-xs">
                          <span className="text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium">
                            Mode: {payment.mode}
                          </span>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className={payment.status === 'completed' ? 'bg-emerald-600 text-white text-[10px]' : 'text-[10px]'}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden md:block) */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="font-semibold text-xs text-slate-600">Date</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Course</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Payment Mode</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Status</TableHead>
                          <TableHead className="text-right font-semibold text-xs text-slate-600">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.enrollmentPayments.map(payment => (
                          <TableRow key={payment.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-medium whitespace-nowrap text-xs text-slate-700">
                              {new Date(payment.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="font-semibold text-xs text-slate-900">{payment.enrollment.course.name}</TableCell>
                            <TableCell className="capitalize text-xs text-slate-600">{payment.mode}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className={payment.status === 'completed' ? 'bg-emerald-600 text-white text-[11px]' : 'text-[11px]'}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-sm">{formatCurrency(payment.amount)}</TableCell>
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
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base sm:text-lg text-slate-900">Cabin Transaction History</CardTitle>
              <CardDescription className="text-xs sm:text-sm">A complete chronological log of all your study cabin reservations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {student?.payments && student.payments.length > 0 ? (
                <div>
                  {/* Mobile Stacked Card View (md:hidden) */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {student.payments.map(payment => (
                      <div key={payment.id} className="p-4 space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">Cabin {payment.booking.cabin.cabinNum} (Floor {payment.booking.cabin.floor})</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(payment.receivedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600 text-base">{formatCurrency(payment.amount)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 text-xs">
                          <span className="text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium">
                            Mode: {payment.mode}
                          </span>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className={payment.status === 'completed' ? 'bg-emerald-600 text-white text-[10px]' : 'text-[10px]'}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden md:block) */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="font-semibold text-xs text-slate-600">Date</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Cabin Details</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Payment Mode</TableHead>
                          <TableHead className="font-semibold text-xs text-slate-600">Status</TableHead>
                          <TableHead className="text-right font-semibold text-xs text-slate-600">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.payments.map(payment => (
                          <TableRow key={payment.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-medium whitespace-nowrap text-xs text-slate-700">
                              {new Date(payment.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </TableCell>
                            <TableCell className="font-semibold text-xs text-slate-900">Floor {payment.booking.cabin.floor}, Cabin {payment.booking.cabin.cabinNum}</TableCell>
                            <TableCell className="capitalize text-xs text-slate-600">{payment.mode}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className={payment.status === 'completed' ? 'bg-emerald-600 text-white text-[11px]' : 'text-[11px]'}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-sm">{formatCurrency(payment.amount)}</TableCell>
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
    </div>
  )
}
