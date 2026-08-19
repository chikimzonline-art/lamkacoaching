import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { Bell, Calendar, Pin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardNoticesPage() {
  await requireStudent()

  const notices = await db.notice.findMany({
    where: { status: 'published' },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Announcements & Notices</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5">Stay updated with the latest news, schedules, and important alerts from Lamka Coaching.</p>
      </div>

      {notices.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {notices.map(notice => (
            <Card key={notice.id} className={`border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md ${notice.pinned ? 'border-blue-300 ring-1 ring-blue-100 bg-blue-50/20' : ''}`}>
              <CardHeader className="p-5 sm:p-6 pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      {notice.pinned && <Pin className="h-4 w-4 text-blue-600 fill-blue-600 shrink-0" />}
                      {notice.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(notice.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  {notice.pinned && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Important
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-0">
                <div 
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: notice.content }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-slate-200 shadow-none bg-white rounded-3xl p-8 sm:p-12">
          <CardContent className="flex flex-col items-center justify-center p-0 text-center">
            <div className="rounded-full bg-slate-100 p-5 mb-4">
              <Bell className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">No Announcements</h3>
            <p className="text-slate-500 text-sm mt-1.5 max-w-md">There are no new notices at the moment. We'll post important updates here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
