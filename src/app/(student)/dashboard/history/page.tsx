import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { AlertCircle, FileText, Receipt } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/helpers"
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button"
import { CancelEnrollmentButton } from "@/components/enrollments/cancel-enrollment-button"
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button"
import { StudentBillingHistory } from "@/components/students/student-billing-history"

export default async function DashboardHistoryPage() {
  const { student } = await requireStudent()

  // Fetch business settings
  const settings = await db.setting.findMany({
    where: {
      key: { in: ["business_name", "business_address", "business_phone", "business_email"] }
    }
  })

  const getSetting = (key: string, def: string) => settings.find(s => s.key === key)?.value || def

  const businessInfo = {
    name: getSetting("business_name", "Lamka Coaching Center"),
    address: getSetting("business_address", "2nd Floor, Synod House, Hill Town, Churachandpur, Manipur - 795128"),
    phone: getSetting("business_phone", "+91 69091 62980"),
    email: getSetting("business_email", "lamkacoaching@gmail.com"),
  }

  // Calculate pending items
  const pendingEnrollments = student.enrollments.filter(
    e => e.status === "pending_payment" || (e.totalFee - e.paidAmount > 0)
  )
  const pendingBookings = student.bookings.filter(
    b => (b.totalAmount - b.paidAmount > 0)
  )

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Billing & History</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5">
          View your pending dues and click any past transaction to view and print official receipts.
        </p>
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
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="font-extrabold text-red-600 text-base sm:text-lg">
                        {formatCurrency(enrollment.totalFee - enrollment.paidAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400">Total: {formatCurrency(enrollment.totalFee)}</p>
                    </div>
                    {enrollment.status === "pending_payment" && enrollment.paidAmount === 0 && (
                      <CancelEnrollmentButton
                        enrollmentId={enrollment.id}
                        variant="outline"
                        className="h-9 text-xs font-semibold px-3 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                      />
                    )}
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
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Cabin {booking.cabin.cabinNum} (Floor {booking.cabin.floor})
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">{booking.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="font-extrabold text-red-600 text-base sm:text-lg">
                        {formatCurrency(booking.totalAmount - booking.paidAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400">Total: {formatCurrency(booking.totalAmount)}</p>
                    </div>
                    {booking.status === "pending_payment" && booking.paidAmount === 0 && (
                      <CancelBookingButton
                        bookingId={booking.id}
                        className="h-9 text-xs font-semibold px-3 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                      />
                    )}
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

      {/* Interactive Billing History Component */}
      <StudentBillingHistory student={student as any} businessInfo={businessInfo} />
    </div>
  )
}
