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
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements & Notices</h1>
        <p className="text-muted-foreground mt-2">Stay updated with the latest news, schedules, and important alerts from Lamka Coaching.</p>
      </div>

      {notices.length > 0 ? (
        <div className="space-y-6">
          {notices.map(notice => (
            <Card key={notice.id} className={`border-none shadow-sm ${notice.pinned ? 'bg-blue-50/50 ring-1 ring-blue-100' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {notice.pinned && <Pin className="h-4 w-4 text-blue-600 fill-blue-600" />}
                      {notice.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(notice.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  {notice.pinned && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none shrink-0">
                      Important
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none text-slate-700" 
                  dangerouslySetInnerHTML={{ __html: notice.content }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 shadow-none bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-100 p-5 mb-4">
              <Bell className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">No Announcements</h3>
            <p className="text-slate-500 mt-2 max-w-md">There are no new notices at the moment. We'll post important updates here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
