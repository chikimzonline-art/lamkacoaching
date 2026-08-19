import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { HelpCircle, MessageSquare, Send, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { submitSupportTicket } from "./actions"

export default async function DashboardSupportPage() {
  const { student } = await requireStudent()

  const tickets = await db.supportTicket.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Help & Support</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5">Need assistance? Raise a support ticket and our team will get back to you.</p>
      </div>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl sticky top-24 overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <MessageSquare className="h-4 w-4 text-blue-600" /> New Support Ticket
              </CardTitle>
              <CardDescription className="text-xs">Describe your issue or query.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form action={async (formData) => { 'use server'; await submitSupportTicket(formData); }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-semibold text-slate-700">Subject</Label>
                  <Input id="subject" name="subject" placeholder="e.g. Study Cabin lighting issue" className="rounded-xl border-slate-200" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-semibold text-slate-700">Detailed Message</Label>
                  <Textarea 
                    id="message" 
                    name="message" 
                    placeholder="Describe your issue or request in detail..." 
                    rows={4} 
                    className="rounded-xl border-slate-200"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-10 shadow-xs cursor-pointer">
                  <Send className="mr-2 h-4 w-4" /> Submit Ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4 sm:space-y-6">
           <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-slate-500" /> My Support Requests ({tickets.length})
          </h2>
          
          {tickets.length > 0 ? (
            <div className="space-y-3.5">
              {tickets.map(ticket => (
                <Card key={ticket.id} className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-3 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-bold text-slate-900">{ticket.subject}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <span>{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="font-mono text-slate-400">ID: {ticket.id.slice(-6).toUpperCase()}</span>
                        </CardDescription>
                      </div>
                      <Badge variant={ticket.status === 'open' ? 'secondary' : 'outline'} className={ticket.status === 'open' ? 'bg-amber-100 text-amber-800 border-none text-[11px] font-semibold' : 'text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px] font-semibold'}>
                        {ticket.status === 'open' ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Open</span>
                        ) : (
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Resolved</span>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
                    {ticket.adminReply && (
                      <div className="bg-blue-50/70 border-l-3 border-blue-600 p-3.5 rounded-r-xl mt-2">
                        <p className="text-xs font-bold text-blue-900 mb-1">Administrative Reply:</p>
                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">{ticket.adminReply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-slate-200 shadow-none bg-white rounded-3xl p-8 sm:p-12 text-center">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <div className="rounded-full bg-slate-100 p-4 mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-base text-slate-900">No Support Tickets</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-sm">You haven't submitted any support requests yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
