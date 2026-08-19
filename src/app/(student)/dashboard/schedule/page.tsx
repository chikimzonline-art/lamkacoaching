import { requireStudent } from "@/lib/student-auth"
import Link from "next/link"
import { Calendar as CalendarIcon, Clock, MapPin, Search, CalendarX, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardSchedulePage() {
  const { student } = await requireStudent()
  
  // Dummy schedule for demonstration purposes
  const dummySchedule = [
    { day: "Monday", subject: "Mathematics - Calculus", time: "09:00 AM - 10:30 AM", room: "Room 101" },
    { day: "Monday", subject: "Physics - Mechanics", time: "11:00 AM - 12:30 PM", room: "Room 102" },
    { day: "Tuesday", subject: "Chemistry - Organic", time: "10:00 AM - 11:30 AM", room: "Lab A" },
    { day: "Wednesday", subject: "Mathematics - Algebra", time: "09:00 AM - 10:30 AM", room: "Room 101" },
    { day: "Thursday", subject: "Physics - Electromagnetism", time: "02:00 PM - 03:30 PM", room: "Room 103" },
    { day: "Friday", subject: "Mock Test", time: "09:00 AM - 12:00 PM", room: "Hall A" },
  ]

  const hasEnrollments = student.enrollments && student.enrollments.length > 0

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Schedule</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5">View your upcoming classes and test timings for the week.</p>
      </div>

      {hasEnrollments ? (
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2.5 text-slate-900">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
              Weekly Timetable
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your scheduled classes for the current academic week.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-slate-100">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const dayClasses = dummySchedule.filter(s => s.day === day)
                  if (dayClasses.length === 0) return null
                  
                  return (
                    <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="md:col-span-1 font-bold text-slate-800 text-sm pt-1">
                        {day}
                      </div>
                      <div className="md:col-span-3 space-y-2.5">
                        {dayClasses.map((cls, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs gap-3">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{cls.subject}</p>
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" /> {cls.time}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {cls.room}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs rounded-lg border-slate-200 hover:bg-slate-50">
                              Class Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
             </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-slate-200 shadow-none bg-white rounded-3xl p-8 sm:p-12">
          <CardContent className="flex flex-col items-center justify-center p-0 text-center">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center shadow-inner">
                <CalendarX className="h-10 w-10 text-blue-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-900">No Classes Scheduled</h3>
            <p className="text-slate-500 text-sm mt-1.5 max-w-sm mb-6 leading-relaxed">
              You don't have any active course enrollments, so your schedule is currently empty.
            </p>
            <Button asChild className="rounded-xl h-10 px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-2">
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
