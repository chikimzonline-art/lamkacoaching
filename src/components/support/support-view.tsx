'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageSquare, Clock, CheckCircle2, Trash2, Reply } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string;
}

interface SupportTicket {
  id: string;
  studentId: string;
  subject: string;
  message: string;
  adminReply: string | null;
  status: 'open' | 'resolved';
  createdAt: string;
  student: Student;
}

interface TicketCardProps {
  ticket: SupportTicket;
  onDelete: (id: string) => void;
  onReply: (ticket: SupportTicket) => void;
}

const TicketCard = ({ ticket, onDelete, onReply }: TicketCardProps) => (
  <Card className="mb-4 border-none shadow-sm overflow-hidden">
    <CardHeader className={`pb-3 ${ticket.status === 'open' ? 'bg-amber-50/50' : 'bg-slate-50/50'}`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <CardTitle className="text-lg">{ticket.subject}</CardTitle>
          <CardDescription className="text-xs mt-1">
            From: <span className="font-medium text-slate-700">{ticket.student.name}</span> ({ticket.student.phone})
            <span className="mx-2">•</span>
            {new Date(ticket.createdAt).toLocaleString()}
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
           <Badge variant={ticket.status === 'open' ? 'secondary' : 'outline'} className={ticket.status === 'open' ? 'bg-amber-100 text-amber-800' : ''}>
            {ticket.status === 'open' ? 'Open' : 'Resolved'}
          </Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-4 pb-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 mb-1">Issue Description:</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.message}</p>
      </div>
      
      {ticket.adminReply && (
        <div className="bg-slate-50 border-l-2 border-indigo-500 p-3 rounded-r-md">
          <p className="text-xs font-semibold text-indigo-700 mb-1">Your Reply:</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.adminReply}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(ticket.id)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
        {ticket.status === 'open' && (
          <Button size="sm" onClick={() => onReply(ticket)}>
            <Reply className="h-4 w-4 mr-2" /> Reply & Resolve
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function SupportView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (error) {
      toast.error('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openReplyDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyMessage(ticket.adminReply || '');
    setReplyDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'resolved', 
          adminReply: replyMessage || null 
        }),
      });
      
      if (res.ok) {
        toast.success('Ticket resolved successfully');
        setReplyDialogOpen(false);
        fetchTickets();
      } else {
        toast.error('Failed to resolve ticket');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      const res = await fetch(`/api/support/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Ticket deleted');
        fetchTickets();
      } else {
        toast.error('Failed to delete ticket');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');


  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Support Tickets
              </CardTitle>
              <CardDescription>Manage student helpdesk requests.</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchTickets} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="open" className="flex gap-2">
                Open <Badge variant="secondary" className="bg-amber-100 text-amber-800">{openTickets.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved <Badge variant="outline" className="ml-2">{resolvedTickets.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="open">
              {isLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
              ) : openTickets.length > 0 ? (
                openTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onDelete={handleDelete} onReply={openReplyDialog} />)
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                  <p>All caught up! No open support tickets.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resolved">
               {isLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
              ) : resolvedTickets.length > 0 ? (
                resolvedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onDelete={handleDelete} onReply={openReplyDialog} />)
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p>No resolved tickets yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Reply to {selectedTicket?.student.name} and mark this issue as resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Original Message:</Label>
              <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700 whitespace-pre-wrap">
                {selectedTicket?.message}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply">Your Reply (Optional)</Label>
              <Textarea
                id="reply"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response to the student here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
