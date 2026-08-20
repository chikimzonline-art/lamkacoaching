import { requireStudent } from "@/lib/student-auth"
import Link from "next/link"
import { GraduationCap, Building2, Calendar, ChevronRight, BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button"
import { CancelEnrollmentButton } from "@/components/enrollments/cancel-enrollment-button"
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button"
import { formatCurrency } from "@/lib/helpers"

function getBookingTypeLabel(type: string): string {
  switch (type) {
    case 'morning_shift': return 'Morning Shift (5AM - 10AM)';
    case 'day_shift': return 'Day Shift (10AM - 5PM)';
    case 'night_shift': return 'Night Shift (5PM - 12AM)';
    case 'reserved': return 'Exclusive Reserved';
    default: return type.replace('_', ' ');
  }
}

export default async function MyLearningPage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const { student } = await requireStudent();
  const resolvedParams = searchParams ? await searchParams : {};
  const requestedTab = resolvedParams.tab;
  const initialTab = requestedTab === 'cabins' || requestedTab === 'my-cabins' ? 'my-cabins' : 'my-courses';

  const allEnrollments = student.enrollments || [];
  const activeBookings = student.bookings || [];

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Enrollment & Booking</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5">Manage your current active courses and study cabin reservations.</p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto flex w-full max-w-md border border-slate-200/60">
          <TabsTrigger 
            value="my-courses" 
            className="flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
          >
            Course Enrollments ({allEnrollments.length})
          </TabsTrigger>
          <TabsTrigger 
            value="my-cabins" 
            className="flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
          >
            Cabin Bookings ({activeBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: My Courses */}
        <TabsContent value="my-courses" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-4">
            {allEnrollments.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allEnrollments.map(enrollment => (
                  <Card key={enrollment.id} className="group overflow-hidden border-none shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-blue-500/20">
                    <div className="h-32 w-full bg-gradient-to-br from-blue-100 to-indigo-50 group-hover:from-blue-200 group-hover:to-indigo-100 transition-colors flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-blue-400" />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'} className={enrollment.status === 'active' ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                          {enrollment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-700 transition-colors">{enrollment.course.name}</CardTitle>
                      <CardDescription className="line-clamp-2">Enrolled on {new Date(enrollment.startDate).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground">Fee Paid</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(enrollment.paidAmount)} / {formatCurrency(enrollment.totalFee)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex text-xs justify-between text-slate-500">
                          <span>Course Progress</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} className="h-1.5 bg-slate-200 [&>div]:bg-blue-500" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2">
                      {enrollment.paidAmount < enrollment.totalFee ? (
                        <>
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
                            buttonText="Pay Pending Dues"
                            className="w-full"
                          />
                          {enrollment.status === 'pending_payment' && enrollment.paidAmount === 0 && (
                            <CancelEnrollmentButton
                              enrollmentId={enrollment.id}
                              variant="outline"
                              className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full inline-flex h-9 items-center justify-center rounded-md bg-green-50 text-green-700 px-4 py-2 text-sm font-medium border border-green-200">
                          Fully Paid
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 shadow-none bg-slate-50/50 mt-4">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <BookOpen className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">No Active Enrollments</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mb-6">You haven't enrolled in any courses yet. Start your journey today.</p>
                  <Link 
                    href="/dashboard/courses" 
                    className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700"
                  >
                    Explore Courses
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: My Cabins */}
        <TabsContent value="my-cabins" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-4">
            {activeBookings.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeBookings.map(booking => (
                  <Card key={booking.id} className="group overflow-hidden border-none shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-emerald-500/20">
                    <div className="h-28 w-full bg-gradient-to-br from-emerald-100 to-teal-50 group-hover:from-emerald-200 group-hover:to-teal-100 transition-colors flex flex-col items-center justify-center">
                      <Building2 className="h-10 w-10 text-emerald-500 mb-1" />
                      <span className="font-bold text-emerald-800 text-lg">Cabin {booking.cabin.cabinNum}</span>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={booking.status === 'active' ? 'default' : 'outline'} className={booking.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                          {booking.status}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">Floor {booking.cabin.floor}</span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-emerald-700 transition-colors">
                        {getBookingTypeLabel(booking.type)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-3">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="mr-2 h-4 w-4 opacity-70" />
                        <span>Ends: {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-semibold text-slate-700">
                          {formatCurrency(booking.paidAmount)} / {formatCurrency(booking.totalAmount)}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2">
                      {booking.paidAmount < booking.totalAmount && (
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
                          buttonText="Pay Pending Dues"
                          className="w-full"
                        />
                      )}
                      {booking.status === 'pending_payment' && booking.paidAmount === 0 && (
                        <CancelBookingButton
                          bookingId={booking.id}
                          className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        />
                      )}
                      <Link 
                        href={`/dashboard/cabins/${booking.id}`} 
                        className="w-full inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        Manage Booking
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 shadow-none bg-slate-50/50 mt-4">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <Building2 className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">No Active Bookings</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mb-6">You don't have any study cabin bookings yet. Get a quiet space to maximize your focus.</p>
                  <Link 
                    href="/dashboard/cabins" 
                    className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-emerald-700"
                  >
                    Explore Cabins
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
