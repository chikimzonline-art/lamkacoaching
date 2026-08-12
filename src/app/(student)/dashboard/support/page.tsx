import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { HelpCircle, MessageSquare, Plus, Clock, CheckCircle2 } from "lucide-react"
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
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground mt-2">Need assistance? Raise a ticket and our admin team will get back to you.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="border-none shadow-sm sticky top-24">
            <CardHeader className="bg-slate-50/80 border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" /> New Request
              </CardTitle>
              <CardDescription>Submit a new support ticket.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={async (formData) => { 'use server'; await submitSupportTicket(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="e.g. AC not working" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    name="message" 
                    placeholder="Describe your issue in detail..." 
                    rows={5} 
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
           <h2 className="text-xl font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-slate-500" /> My Tickets
          </h2>
          
          {tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map(ticket => (
                <Card key={ticket.id} className="border-none shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 bg-slate-50/50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-400">ID: {ticket.id.slice(-6).toUpperCase()}</span>
                        </CardDescription>
                      </div>
                      <Badge variant={ticket.status === 'open' ? 'secondary' : 'outline'} className={ticket.status === 'open' ? 'bg-amber-100 text-amber-800 border-none hover:bg-amber-100' : 'text-slate-500'}>
                        {ticket.status === 'open' ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Open</span>
                        ) : (
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Resolved</span>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-4 space-y-4">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.message}</p>
                    {ticket.adminReply && (
                      <div className="bg-slate-50 border-l-2 border-indigo-500 p-4 rounded-r-md">
                        <p className="text-xs font-semibold text-indigo-700 mb-1">Admin Reply:</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.adminReply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 shadow-none bg-slate-50/50 h-64">
              <CardContent className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-slate-100 p-4 mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900">No Support Tickets</h3>
                <p className="text-slate-500 mt-2 max-w-sm">You haven't submitted any support requests yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
