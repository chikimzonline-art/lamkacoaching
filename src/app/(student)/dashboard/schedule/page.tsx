import { requireStudent } from "@/lib/student-auth"
import Link from "next/link"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Search, 
  CalendarX, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function getCurrentWeekDays() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  // Calculate distance to Monday (if Sunday (0), treat as past Saturday or start of new week; standard Mon start)
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const days = [
    { name: "Monday", short: "Mon", offset: 0 },
    { name: "Tuesday", short: "Tue", offset: 1 },
    { name: "Wednesday", short: "Wed", offset: 2 },
    { name: "Thursday", short: "Thu", offset: 3 },
    { name: "Friday", short: "Fri", offset: 4 },
    { name: "Saturday", short: "Sat", offset: 5 },
  ];

  return days.map(d => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + d.offset);
    const isToday = date.toDateString() === now.toDateString();
    
    return {
      name: d.name,
      short: d.short,
      date,
      dateFormatted: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      isToday,
    };
  });
}

export default async function DashboardSchedulePage() {
  const { student } = await requireStudent();
  const weekDays = getCurrentWeekDays();
  const weekRangeFormatted = `${weekDays[0].dateFormatted} – ${weekDays[5].dateFormatted}, ${weekDays[0].date.getFullYear()}`;

  // Filter enrollments with a valid batch
  const activeEnrollments = (student.enrollments || []).filter(
    (e: any) => e.batch && e.status === "active"
  );

  const hasEnrollments = activeEnrollments.length > 0;

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Schedule</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1.5">
            Your regular Monday to Saturday class timetable for the active week.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 w-fit">
          <CalendarIcon className="h-4 w-4 text-cyan-600 shrink-0" />
          <span>{weekRangeFormatted}</span>
        </div>
      </div>

      {hasEnrollments ? (
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5 text-slate-900">
                  <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  Weekly Routine (Mon – Sat)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Classes dynamically generated for your {activeEnrollments.length} enrolled {activeEnrollments.length === 1 ? 'batch' : 'batches'}.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Active Batches</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {weekDays.map((day) => {
                // Check active classes for this specific day date
                const dayDate = new Date(day.date);
                dayDate.setHours(23, 59, 59, 999);

                const classes = activeEnrollments.map((enr: any) => {
                  const batch = enr.batch;
                  const course = enr.course;
                  const batchStart = batch.startDate ? new Date(batch.startDate) : null;
                  const batchEnd = batch.endDate ? new Date(batch.endDate) : null;
                  if (batchEnd) batchEnd.setHours(23, 59, 59, 999);

                  const isStarted = !batchStart || batchStart <= dayDate;
                  const isEnded = batchEnd && batchEnd < day.date;

                  return {
                    id: `${batch.id}-${day.name}`,
                    courseName: course?.name || "Coaching Class",
                    batchName: batch.batchName,
                    department: course?.department?.name,
                    timing: batch.timing || "Timing Scheduled",
                    isStarted,
                    isEnded,
                    startDateFormatted: batchStart?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                  };
                });

                return (
                  <div 
                    key={day.name} 
                    className={`grid grid-cols-1 md:grid-cols-4 gap-3.5 p-4 sm:p-5 transition-colors ${
                      day.isToday ? "bg-cyan-50/40 border-l-4 border-l-cyan-600" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="md:col-span-1 pt-1 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${day.isToday ? "text-cyan-900" : "text-slate-800"}`}>
                          {day.name}
                        </span>
                        {day.isToday && (
                          <Badge className="bg-cyan-600 hover:bg-cyan-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                            Today
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {day.dateFormatted}
                      </span>
                    </div>

                    <div className="md:col-span-3 space-y-2.5">
                      {classes.length > 0 ? (
                        classes.map((cls: any) => {
                          if (cls.isEnded) return null;

                          return (
                            <div 
                              key={cls.id} 
                              className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs gap-3.5 hover:border-slate-300 transition-all"
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-slate-900 text-sm">{cls.courseName}</p>
                                  <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-600 border-slate-200">
                                    {cls.batchName}
                                  </Badge>
                                  {cls.department && (
                                    <span className="text-[11px] text-slate-600 font-medium">
                                      • {cls.department}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                                  <span className="flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100/70 px-2 py-0.5 rounded-md">
                                    <Clock className="h-3.5 w-3.5 text-cyan-600" /> {cls.timing}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-slate-600" /> Main Campus
                                  </span>
                                  {!cls.isStarted && (
                                    <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                      <AlertCircle className="h-3.5 w-3.5" /> Starts {cls.startDateFormatted}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Confirmed
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-600 italic py-2">
                          No scheduled classes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-slate-200 shadow-none bg-white rounded-3xl p-8 sm:p-12">
          <CardContent className="flex flex-col items-center justify-center p-0 text-center">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center shadow-inner">
                <CalendarX className="h-10 w-10 text-cyan-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-900">No Classes Scheduled</h3>
            <p className="text-slate-500 text-sm mt-1.5 max-w-sm mb-6 leading-relaxed">
              You don't have any active course enrollments with a batch assigned, so your timetable is currently empty.
            </p>
            <Button asChild className="rounded-xl h-10 px-6 font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs gap-2">
              <Link href="/dashboard/courses">
                Explore Available Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
