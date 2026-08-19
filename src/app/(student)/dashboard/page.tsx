import { requireStudent } from "@/lib/student-auth"
import Link from "next/link"
import { BookOpen, Building2, AlertCircle, Calendar, GraduationCap, ChevronRight, Clock, ArrowUpRight } from "lucide-react"
import { formatCurrency } from "@/lib/helpers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function DashboardPage() {
  const { student } = await requireStudent()

  const allEnrollments = student.enrollments || []
  const activeBookings = student.bookings || []

  const pendingEnrollments = allEnrollments.filter(e => e.status === "pending_payment" || (e.totalFee - e.paidAmount > 0))
  const pendingBookings = activeBookings.filter(b => (b.totalAmount - b.paidAmount > 0))
  
  const pendingCabinCheckout = activeBookings.find(b => b.status === "pending_payment" && b.paidAmount === 0 && b.cabinId)

  const totalPendingEnrollment = pendingEnrollments.reduce((acc, curr) => acc + (curr.totalFee - curr.paidAmount), 0)
  const totalPendingBooking = pendingBookings.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0)
  const totalPending = totalPendingEnrollment + totalPendingBooking
  const hasPendingDues = totalPending > 0

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-deep-navy via-slate-900 to-indigo-950 p-6 sm:p-8 shadow-md border border-slate-800/40">
        <div className="relative z-10 flex flex-col justify-center h-full text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium w-fit mb-3 backdrop-blur-xs border border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Student Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Welcome back, {student.name}!</h1>
          <p className="text-slate-300 max-w-lg text-sm sm:text-base leading-relaxed">
            Ready to continue your learning journey? Check your quick stats and explore our offerings below.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-12 -mt-12 text-white/5 pointer-events-none">
          <GraduationCap className="h-64 w-64 rotate-12" />
        </div>
      </div>

      {pendingCabinCheckout && (
        <Alert className="bg-amber-50 border-amber-200">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 font-bold">Pending Checkout in Progress</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <span className="text-amber-800 text-sm">You have an uncompleted cabin booking. The cabin is being held for you temporarily.</span>
            <Link 
              href="/dashboard/cabins" 
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center shrink-0"
            >
              View Checkout
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {hasPendingDues && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Dues Alert</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You have pending dues of <span className="font-bold">{formatCurrency(totalPending)}</span>.</span>
            <Link href="/dashboard/history" className="font-semibold underline underline-offset-2 hover:text-red-800 transition-colors">
              Pay Now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats - Drill Down Navigation */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Active Courses Stat Card */}
        <Link 
          href="/dashboard/my-learning?tab=my-courses" 
          className="group block focus:outline-none"
        >
          <Card className="border border-slate-200/80 shadow-xs bg-white hover:shadow-md hover:border-blue-300 transition-all rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Courses</CardTitle>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <GraduationCap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-slate-900">{allEnrollments.length}</div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              {allEnrollments.length === 0 ? (
                <span className="text-xs font-medium text-blue-600 mt-2 inline-flex items-center hover:underline">
                  Enroll in a course &rarr;
                </span>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Tap to view ongoing classes</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Study Cabins Stat Card */}
        <Link 
          href="/dashboard/my-learning?tab=my-cabins" 
          className="group block focus:outline-none"
        >
          <Card className="border border-slate-200/80 shadow-xs bg-white hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Cabins</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-slate-900">{activeBookings.length}</div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              {activeBookings.length === 0 ? (
                <span className="text-xs font-medium text-emerald-600 mt-2 inline-flex items-center hover:underline">
                  Book a cabin &rarr;
                </span>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Tap to manage cabin bookings</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Next Class Stat Card */}
        <Link 
          href="/dashboard/schedule" 
          className="group block focus:outline-none"
        >
          <Card className="border border-slate-200/80 shadow-xs bg-white hover:shadow-md hover:border-purple-300 transition-all rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Class</CardTitle>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-bold text-slate-900">Tomorrow · 9 AM</div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Tap to view full timetable</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <Link href="/dashboard/my-learning" className="block group focus:outline-none">
          <Card className="border border-slate-200/80 shadow-xs bg-white hover:shadow-md hover:border-indigo-300 transition-all rounded-2xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="rounded-xl bg-indigo-50 p-3 w-fit mb-3 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">My Learning</CardTitle>
              <CardDescription className="text-xs text-slate-500">View active course enrollments and cabin reservations.</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <span className="text-xs text-indigo-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                Go to My Learning <ChevronRight className="h-4 w-4 ml-0.5" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/dashboard/courses" className="block group focus:outline-none">
          <Card className="border border-slate-200/80 shadow-xs bg-white hover:shadow-md hover:border-blue-300 transition-all rounded-2xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="rounded-xl bg-blue-50 p-3 w-fit mb-3 group-hover:bg-blue-600 group-hover:text-white text-blue-700 transition-colors">
                <GraduationCap className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Explore Courses</CardTitle>
              <CardDescription className="text-xs text-slate-500">Discover new courses and expand your career skills.</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <span className="text-xs text-blue-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                Browse Catalog <ChevronRight className="h-4 w-4 ml-0.5" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/dashboard/cabins" className="block group focus:outline-none">
          <Card className="border border-slate-200/80 shadow-xs bg-white hover:shadow-md hover:border-emerald-300 transition-all rounded-2xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="rounded-xl bg-emerald-50 p-3 w-fit mb-3 group-hover:bg-emerald-600 group-hover:text-white text-emerald-700 transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Explore Cabins</CardTitle>
              <CardDescription className="text-xs text-slate-500">Reserve a personal, air-conditioned study space.</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <span className="text-xs text-emerald-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                Book a Cabin <ChevronRight className="h-4 w-4 ml-0.5" />
              </span>
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
