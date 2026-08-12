import { requireStudent } from "@/lib/student-auth"
import { Calendar as CalendarIcon, Clock, MapPin, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardSchedulePage() {
  const { student } = await requireStudent()
  
  // Dummy schedule for demonstration purposes since we don't have a robust Timetable model yet
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
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
        <p className="text-muted-foreground mt-2">View your upcoming classes and test timings for the week.</p>
      </div>

      {hasEnrollments ? (
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" /> Weekly Timetable
            </CardTitle>
            <CardDescription>Your classes for the current week.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-slate-100">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const dayClasses = dummySchedule.filter(s => s.day === day)
                  if (dayClasses.length === 0) return null
                  
                  return (
                    <div key={day} className="grid md:grid-cols-4 gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="md:col-span-1 font-semibold text-slate-900 pt-1">
                        {day}
                      </div>
                      <div className="md:col-span-3 space-y-3">
                        {dayClasses.map((cls, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border rounded-lg p-3 shadow-sm gap-3">
                            <div>
                              <p className="font-medium text-indigo-900">{cls.subject}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {cls.time}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {cls.room}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs bg-slate-50 hover:bg-slate-100">
                              View Details
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
        <Card className="border-dashed border-2 shadow-none bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-100 p-5 mb-4">
              <CalendarIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">No Classes Scheduled</h3>
            <p className="text-slate-500 mt-2 max-w-md mb-6">You don't have any active course enrollments, so your schedule is empty.</p>
            <Button asChild>
              <a href="/dashboard/courses/register">Browse Courses</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
