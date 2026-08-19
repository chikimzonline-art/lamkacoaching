import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"
import Link from "next/link"
import { Search, Sparkles, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseCard } from "./course-card"

export default async function ExploreCoursesPage() {
  const { student } = await requireStudent()

  // Fetch active/waitlist/coming_soon courses with their departments, batches, and waitlists
  const getCachedCourses = unstable_cache(
    async () => {
      return await db.course.findMany({
        where: { status: { not: "inactive" } },
        include: { 
          department: true,
          batches: {
            where: { active: true, status: { in: ['enrolling', 'almost_full'] } },
            orderBy: { startDate: 'asc' }
          }
        }
      })
    },
    ['active-courses'],
    { revalidate: 300, tags: ['courses'] }
  )
  
  const courses = await getCachedCourses()
  
  const waitlistedCourseIds = await db.courseWaitlist.findMany({
    where: { studentId: student.id },
    select: { courseId: true }
  }).then(list => list.map(item => item.courseId));
  
  // Filter out courses the student is already enrolled in
  const enrolledCourseIds = student.enrollments.map(e => e.courseId)
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id))

  // Extract unique departments from available courses
  const departments = Array.from(new Set(availableCourses.map(c => c.department.name)))

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Explore Courses</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5">Discover new courses and expand your skills. Filter by department below.</p>
      </div>

      {availableCourses.length > 0 ? (
        <Tabs defaultValue="All" className="space-y-6">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto flex w-max gap-1.5 border border-slate-200/60">
              <TabsTrigger 
                value="All"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all"
              >
                All Courses ({availableCourses.length})
              </TabsTrigger>
              {departments.map(dept => {
                const count = availableCourses.filter(c => c.department.name === dept).length;
                return (
                  <TabsTrigger 
                    key={dept} 
                    value={dept}
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all"
                  >
                    {dept} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* "All" Tab Content */}
          <TabsContent value="All" className="focus-visible:outline-none focus-visible:ring-0">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableCourses.map(course => (
                <CourseCard key={course.id} course={course} student={student} isWaitlisted={waitlistedCourseIds.includes(course.id)} />
              ))}
            </div>
          </TabsContent>

          {/* Department Tabs Content */}
          {departments.map(dept => {
            const deptCourses = availableCourses.filter(c => c.department.name === dept)
            return (
              <TabsContent key={dept} value={dept} className="focus-visible:outline-none focus-visible:ring-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {deptCourses.map(course => (
                     <CourseCard key={course.id} course={course} student={student} isWaitlisted={waitlistedCourseIds.includes(course.id)} />
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center text-gray-500 bg-slate-50">
          <Search className="h-8 w-8 mx-auto mb-3 text-slate-400" />
          <h3 className="text-lg font-medium text-gray-900">No New Courses Found</h3>
          <p className="mt-1">You are already enrolled in all available courses, or none are currently active.</p>
        </div>
      )}
    </div>
  )
}


