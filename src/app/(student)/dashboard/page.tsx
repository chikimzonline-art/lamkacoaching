import { requireStudent } from "@/lib/student-auth"
import Link from "next/link"
import { BookOpen, MapPin, AlertCircle, Calendar, GraduationCap, ChevronRight, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function DashboardPage() {
  const { student } = await requireStudent()

  const allEnrollments = student.enrollments || []
  const activeBookings = student.bookings || []

  const pendingEnrollments = allEnrollments.filter(e => e.status === "pending_payment" || (e.totalFee - e.paidAmount > 0))
  const pendingBookings = activeBookings.filter(b => b.status === "pending_payment" || (b.totalAmount - b.paidAmount > 0))

  const totalPendingEnrollment = pendingEnrollments.reduce((acc, curr) => acc + (curr.totalFee - curr.paidAmount), 0)
  const totalPendingBooking = pendingBookings.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0)
  const totalPending = totalPendingEnrollment + totalPendingBooking
  const hasPendingDues = totalPending > 0

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-md">
        <div className="relative z-10 flex flex-col justify-center h-full text-white">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {student.name}!</h1>
          <p className="text-blue-100 max-w-lg text-lg">
            Ready to continue your learning journey? Check your quick stats and explore our offerings below.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 text-blue-500/20">
          <GraduationCap className="h-64 w-64 rotate-12" />
        </div>
      </div>

      {hasPendingDues && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Dues Alert</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You have pending dues of <span className="font-bold">₹{totalPending / 100}</span>.</span>
            <Link href="/dashboard/history" className="font-medium underline underline-offset-2 hover:text-red-800 transition-colors">
              Pay Now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allEnrollments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Cabins</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Class</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tomorrow, 9 AM</div>
            <p className="text-xs text-muted-foreground">Mathematics (Dummy)</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/dashboard/my-learning" className="block group">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow h-full">
            <CardHeader>
              <div className="rounded-lg bg-indigo-100 p-3 w-fit mb-2 group-hover:bg-indigo-200 transition-colors">
                <BookOpen className="h-6 w-6 text-indigo-700" />
              </div>
              <CardTitle>My Enrollment & Booking</CardTitle>
              <CardDescription>View your active courses and cabin reservations.</CardDescription>
            </CardHeader>
            <CardFooter>
              <span className="text-sm text-indigo-600 font-medium flex items-center">
                Go to My Learning <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </CardFooter>
          </Card>
        </Link>
        <Link href="/dashboard/courses" className="block group">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow h-full">
            <CardHeader>
              <div className="rounded-lg bg-blue-100 p-3 w-fit mb-2 group-hover:bg-blue-200 transition-colors">
                <Search className="h-6 w-6 text-blue-700" />
              </div>
              <CardTitle>Explore Courses</CardTitle>
              <CardDescription>Discover new courses and expand your skills.</CardDescription>
            </CardHeader>
            <CardFooter>
              <span className="text-sm text-blue-600 font-medium flex items-center">
                Browse Catalog <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </CardFooter>
          </Card>
        </Link>
        <Link href="/dashboard/cabins" className="block group">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow h-full">
            <CardHeader>
              <div className="rounded-lg bg-emerald-100 p-3 w-fit mb-2 group-hover:bg-emerald-200 transition-colors">
                <MapPin className="h-6 w-6 text-emerald-700" />
              </div>
              <CardTitle>Explore Cabins</CardTitle>
              <CardDescription>Find a quiet space to focus and study.</CardDescription>
            </CardHeader>
            <CardFooter>
              <span className="text-sm text-emerald-600 font-medium flex items-center">
                Book a Cabin <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
