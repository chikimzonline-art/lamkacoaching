import { requireStudent } from "@/lib/student-auth";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  AlertCircle,
  Calendar,
  GraduationCap,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { formatCurrency } from "@/lib/helpers";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { student } = await requireStudent();

  const allEnrollments = student.enrollments || [];
  const activeBookings = student.bookings || [];

  const pendingEnrollments = allEnrollments.filter(
    (e) => e.status === "pending_payment" || e.totalFee - e.paidAmount > 0
  );
  const pendingBookings = activeBookings.filter((b) => b.totalAmount - b.paidAmount > 0);

  const pendingCabinCheckout = activeBookings.find(
    (b) => b.status === "pending_payment" && b.paidAmount === 0 && b.cabinId
  );

  const totalPendingEnrollment = pendingEnrollments.reduce(
    (acc, curr) => acc + (curr.totalFee - curr.paidAmount),
    0
  );
  const totalPendingBooking = pendingBookings.reduce(
    (acc, curr) => acc + (curr.totalAmount - curr.paidAmount),
    0
  );
  const totalPending = totalPendingEnrollment + totalPendingBooking;
  const hasPendingDues = totalPending > 0;

  // Active Enrollments & Next Class Logic
  const activeEnrs = allEnrollments.filter((e) => e.status === "active");
  const activeCabinsList = activeBookings.filter((b) => b.status === "active");

  const enrsWithBatch = activeEnrs.filter((e) => e.batch);
  const hasClasses = enrsWithBatch.length > 0;
  let nextClassTime = "No Upcoming Classes";
  let nextClassBatch = "No active timetable batch";
  let nextClassCourse = "";

  if (hasClasses) {
    const primaryEnr = enrsWithBatch[0];
    const primaryBatch = primaryEnr.batch;
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon...
    const timingParts = (primaryBatch?.timing || "").split(/[-–—]/);
    const startTime = timingParts[0]?.trim() || primaryBatch?.timing || "Scheduled";

    if (currentDay === 0) {
      nextClassTime = `Monday · ${startTime}`;
    } else {
      nextClassTime = `Today · ${startTime}`;
    }
    nextClassBatch = primaryBatch?.batchName || "Main Batch";
    nextClassCourse = primaryEnr.course?.name || "Enrolled Subject";
  }

  const primaryCabinBooking = activeCabinsList[0];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 sm:p-8 shadow-md border border-slate-800/60 text-white">
        <div className="relative z-10 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium w-fit mb-3 backdrop-blur-xs border border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Student Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5">
            Welcome back, {student.name}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg leading-relaxed">
            Track your classes, access your study cabin, and manage your learning progress.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 text-white/5 pointer-events-none">
          <GraduationCap className="h-60 w-60 rotate-12" />
        </div>
      </div>

      {/* Pending Checkout Alert */}
      {pendingCabinCheckout && (
        <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 font-bold">Pending Checkout in Progress</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <span className="text-amber-800 text-sm">
              You have an uncompleted cabin booking. The cabin is being held for you temporarily.
            </span>
            <Link
              href="/dashboard/cabins"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors text-center shrink-0"
            >
              View Checkout
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Dues Alert */}
      {hasPendingDues && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Dues Alert</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-xs sm:text-sm">
              You have pending dues of <span className="font-bold">{formatCurrency(totalPending)}</span>.
            </span>
            <Link
              href="/dashboard/history"
              className="font-semibold text-xs sm:text-sm underline underline-offset-2 hover:text-red-800 transition-colors"
            >
              Pay Now &rarr;
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* 1. NEXT CLASS HERO CARD (1-Column Full Width)                              */}
      {/* ========================================================================= */}
      <Link href="/dashboard/schedule" className="block group focus:outline-none">
        <Card className="border border-purple-200/80 bg-white hover:bg-purple-50/20 hover:border-purple-300 shadow-xs hover:shadow-md transition-all rounded-2xl sm:rounded-3xl overflow-hidden p-3.5 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5">
                    Next Class
                  </Badge>
                  {hasClasses && (
                    <span className="text-[10px] sm:text-xs text-purple-600 font-medium flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> Scheduled
                    </span>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {nextClassTime}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                  {hasClasses ? `${nextClassCourse} · ${nextClassBatch}` : "Enroll in a course to view your batch schedule."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-center shrink-0 text-purple-600 font-semibold text-[11px] sm:text-xs group-hover:translate-x-0.5 transition-transform pt-1 sm:pt-0">
              <span>View Schedule</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Card>
      </Link>

      {/* ========================================================================= */}
      {/* 2. ACTIVE COURSES & ACTIVE CABINS (2-Column Grid on all screen sizes)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* 2a. Active Courses */}
        <Link
          href="/dashboard/my-learning?tab=my-courses"
          className="block group focus:outline-none"
        >
          <Card className="border border-blue-200/80 bg-white hover:bg-blue-50/30 hover:border-blue-300 shadow-xs hover:shadow-md transition-all rounded-2xl sm:rounded-3xl h-full flex flex-col justify-between p-3.5 sm:p-5">
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5">
                  {activeEnrs.length} Active
                </Badge>
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 mt-2.5 line-clamp-1">
                Active Courses
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                {activeEnrs.length > 0
                  ? activeEnrs.map((e) => e.course?.name).filter(Boolean).slice(0, 2).join(", ")
                  : "No active enrollments."}
              </p>
            </div>
            <div className="pt-2.5 mt-auto border-t border-slate-100/80">
              <span className="text-[10px] sm:text-xs font-semibold text-blue-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                View Courses <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-0.5" />
              </span>
            </div>
          </Card>
        </Link>

        {/* 2b. Active Cabins */}
        <Link
          href="/dashboard/my-learning?tab=my-cabins"
          className="block group focus:outline-none"
        >
          <Card className="border border-emerald-200/80 bg-white hover:bg-emerald-50/30 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all rounded-2xl sm:rounded-3xl h-full flex flex-col justify-between p-3.5 sm:p-5">
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5">
                  {activeCabinsList.length} Active
                </Badge>
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 mt-2.5 line-clamp-1">
                Active Cabin
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                {primaryCabinBooking?.cabin
                  ? `Cabin #${primaryCabinBooking.cabin.cabinNum} (${primaryCabinBooking.type.replace('_', ' ')})`
                  : "No active reservation."}
              </p>
            </div>
            <div className="pt-2.5 mt-auto border-t border-slate-100/80">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                Manage Cabin <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-0.5" />
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 3. MY LEARNING CARDS (1-Column Full Width)                                 */}
      {/* ========================================================================= */}
      <Link href="/dashboard/my-learning" className="block group focus:outline-none">
        <Card className="border border-indigo-200/80 bg-white hover:bg-indigo-50/20 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all rounded-2xl sm:rounded-3xl overflow-hidden p-3.5 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  My Learning & Active Bookings
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 max-w-xl line-clamp-1">
                  View batch timetables, study materials, and cabin shift details.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-center shrink-0 text-indigo-600 font-semibold text-[11px] sm:text-xs group-hover:translate-x-0.5 transition-transform pt-1 sm:pt-0">
              <span>Go to My Learning</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Card>
      </Link>

      {/* ========================================================================= */}
      {/* 4. EXPLORE COURSES & EXPLORE CABINS (2-Column Grid on all screen sizes)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* 4a. Explore Courses */}
        <Link href="/dashboard/courses" className="block group focus:outline-none">
          <Card className="border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md shadow-xs transition-all rounded-2xl sm:rounded-3xl h-full flex flex-col justify-between p-3.5 sm:p-5">
            <div className="space-y-2">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Compass className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-slate-900">Explore Courses</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                  Browse coaching batches & test series.
                </p>
              </div>
            </div>
            <div className="pt-2.5 mt-auto border-t border-slate-100/80">
              <span className="text-[10px] sm:text-xs font-semibold text-blue-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                Browse Catalog <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </span>
            </div>
          </Card>
        </Link>

        {/* 4b. Explore Cabins */}
        <Link href="/dashboard/cabins" className="block group focus:outline-none">
          <Card className="border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md shadow-xs transition-all rounded-2xl sm:rounded-3xl h-full flex flex-col justify-between p-3.5 sm:p-5">
            <div className="space-y-2">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Building2 className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-slate-900">Explore Cabins</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                  Reserve AC study cabin desks.
                </p>
              </div>
            </div>
            <div className="pt-2.5 mt-auto border-t border-slate-100/80">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                Book Space <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
