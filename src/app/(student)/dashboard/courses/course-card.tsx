'use client';

import { useState } from 'react';
import { Calendar, Users, Loader2, Bell } from "lucide-react";
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button";
import { formatCurrency } from "@/lib/helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { joinWaitlist } from './actions';

export function CourseCard({
  course,
  student,
  isWaitlisted = false,
  initialBatchId,
}: {
  course: any;
  student: any;
  isWaitlisted?: boolean;
  initialBatchId?: string;
}) {
  const [selectedBatch, setSelectedBatch] = useState<string>(
    initialBatchId || (course.batches && course.batches.length > 0 ? course.batches[0].id : '')
  );
  const [waitlisting, setWaitlisting] = useState(false);

  const showWaitlist = course.status === 'coming_soon' || course.status === 'waitlist' || course.batches.length === 0;
  const durationText = course.durationValue ? `${course.durationValue} ${course.durationUnit}` : "TBA";

  const handleNotifyMe = async () => {
    try {
      setWaitlisting(true);
      await joinWaitlist(course.id);
      toast.success("You've been added to the waitlist! We'll notify you when a batch opens.");
    } catch (err: any) {
      toast.error(err.message || 'Failed to join waitlist');
    } finally {
      setWaitlisting(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all overflow-hidden">
      <div className="h-32 w-full bg-gradient-to-br from-slate-900 via-deep-navy to-indigo-950 flex flex-col justify-between p-5 text-white">
        <div className="flex justify-between items-start">
          <Badge className="bg-white/15 text-white border border-white/20 text-[11px] font-medium backdrop-blur-xs">
            {course.department.name}
          </Badge>
          {showWaitlist && (
            <Badge variant="outline" className="border-amber-400/50 text-amber-300 bg-amber-500/10 text-[10px]">
              Coming Soon
            </Badge>
          )}
        </div>
        <h3 className="text-lg font-bold line-clamp-1 text-white">{course.name}</h3>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4">
            {course.description || "Comprehensive coaching and guidance tailored for competitive exam excellence."}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700">Duration:</span>
            <span className={course.durationValue ? "text-slate-900" : "text-slate-400 italic"}>{durationText}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Course Fee</span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(course.totalFee)}</span>
          </div>

          {showWaitlist ? (
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-10 font-semibold shadow-xs" 
              onClick={handleNotifyMe}
              disabled={waitlisting || isWaitlisted}
            >
              {waitlisting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
              ) : isWaitlisted ? (
                <><Bell className="mr-2 h-4 w-4 fill-current" /> Waitlisted</>
              ) : (
                <><Bell className="mr-2 h-4 w-4" /> Notify Me When Open</>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              {course.batches.length > 1 ? (
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {course.batches.map((batch: any) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchName} ({batch.status.replace('_', ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg text-center">
                  Batch: <span className="font-medium text-slate-700">{course.batches[0]?.batchName || 'Upcoming Batch'}</span>
                </div>
              )}
              
              <RazorpayCheckoutButton
                type="course"
                itemId={course.id}
                batchId={selectedBatch || course.batches[0]?.id}
                itemName={course.name}
                studentId={student.id}
                studentName={student.name}
                studentEmail={student.email || undefined}
                studentPhone={student.phone}
                totalFee={course.totalFee}
                paidAmount={0}
                isNewEnrollment={true}
                buttonText="Enroll & Pay Now"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-10 shadow-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
