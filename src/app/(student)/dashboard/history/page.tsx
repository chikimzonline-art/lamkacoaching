import { requireStudent } from "@/lib/student-auth"
import { AlertCircle, CreditCard, Receipt, FileText } from "lucide-react"
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & History</h1>
        <p className="text-muted-foreground mt-2">View your pending dues and past transaction history.</p>
      </div>

      {/* Unpaid Dues Section */}
      {(pendingEnrollments.length > 0 || pendingBookings.length > 0) && (
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Pending Dues
            </CardTitle>
            <CardDescription className="text-red-600/80">Please settle these dues as soon as possible to avoid service interruption.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {pendingEnrollments.map(enrollment => (
                <div key={enrollment.id} className="flex justify-between items-center bg-white p-4 border border-red-100 rounded-lg shadow-sm">
                  <div className="flex items-start gap-4">
                     <div className="rounded-full bg-red-100 p-2 text-red-600">
                       <FileText className="h-4 w-4" />
                     </div>
                     <div>
                      <h3 className="font-semibold text-slate-900">{enrollment.course.name}</h3>
                      <p className="text-sm text-slate-500">Course Enrollment</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <p className="font-bold text-red-600 text-lg">{formatCurrency(enrollment.totalFee - enrollment.paidAmount)}</p>
                      <p className="text-xs text-slate-500">Total: {formatCurrency(enrollment.totalFee)}</p>
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
                      className="h-8 text-xs px-3"
                    />
                  </div>
                </div>
              ))}
              {pendingBookings.map(booking => (
                <div key={booking.id} className="flex justify-between items-center bg-white p-4 border border-red-100 rounded-lg shadow-sm">
                  <div className="flex items-start gap-4">
                     <div className="rounded-full bg-red-100 p-2 text-red-600">
                       <Receipt className="h-4 w-4" />
                     </div>
                     <div>
                      <h3 className="font-semibold text-slate-900">Cabin Booking (Floor {booking.cabin.floor}, Cabin {booking.cabin.cabinNum})</h3>
                      <p className="text-sm text-slate-500">Duration: {booking.type}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <p className="font-bold text-red-600 text-lg">{formatCurrency(booking.totalAmount - booking.paidAmount)}</p>
                      <p className="text-xs text-slate-500">Total: {formatCurrency(booking.totalAmount)}</p>
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
                      className="h-8 text-xs px-3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="courses">Course Payments</TabsTrigger>
          <TabsTrigger value="cabins">Cabin Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Course Transaction History</CardTitle>
              <CardDescription>A record of all your payments towards course fees.</CardDescription>
            </CardHeader>
            <CardContent>
              {student?.enrollmentPayments && student.enrollmentPayments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.enrollmentPayments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium whitespace-nowrap">{new Date(payment.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                          <TableCell>{payment.enrollment.course.name}</TableCell>
                          <TableCell className="capitalize">{payment.mode}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className={payment.status === 'completed' ? 'bg-green-600' : ''}>
                                {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">{formatCurrency(payment.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                  <CreditCard className="h-8 w-8 mb-4 text-slate-300" />
                  <p>No course payment history found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cabins" className="mt-6">
           <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Cabin Transaction History</CardTitle>
              <CardDescription>A record of all your payments towards study cabin bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              {student?.payments && student.payments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Cabin Details</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium whitespace-nowrap">{new Date(payment.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                          <TableCell>Floor {payment.booking.cabin.floor}, Cabin {payment.booking.cabin.cabinNum}</TableCell>
                          <TableCell className="capitalize">{payment.mode}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className={payment.status === 'completed' ? 'bg-green-600' : ''}>
                                {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">{formatCurrency(payment.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                  <CreditCard className="h-8 w-8 mb-4 text-slate-300" />
                  <p>No cabin payment history found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
