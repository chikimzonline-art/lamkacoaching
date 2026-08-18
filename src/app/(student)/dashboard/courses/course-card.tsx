'use client';

import { useState } from 'react';
import { Calendar, Users, Loader2, Bell } from "lucide-react";
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button";
import { formatCurrency } from "@/lib/helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { joinWaitlist } from './actions';

export function CourseCard({ course, student, isWaitlisted = false }: { course: any, student: any, isWaitlisted?: boolean }) {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [waitlisting, setWaitlisting] = useState(false);

  const showWaitlist = course.status === 'coming_soon' || course.status === 'waitlist' || course.batches.length === 0;

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
    <div className="flex flex-col rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="h-32 w-full bg-gradient-to-br from-indigo-100 to-purple-50 flex flex-col justify-center px-6 rounded-t-xl">
        <span className="inline-block rounded-full bg-indigo-200/50 px-2.5 py-0.5 text-xs font-semibold text-indigo-900 w-fit">
          {course.department.name}
        </span>
        <h3 className="mt-2 text-xl font-bold line-clamp-1">{course.name}</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
          {course.description || "No description provided."}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4" />
          <span>Duration: {course.durationValue ? `${course.durationValue} ${course.durationUnit}` : "N/A"}</span>
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Fee</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(course.totalFee)}</span>
          </div>

          {showWaitlist ? (
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
              onClick={handleNotifyMe}
              disabled={waitlisting || isWaitlisted}
            >
              {waitlisting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
              ) : isWaitlisted ? (
                <><Bell className="mr-2 h-4 w-4" /> Waitlisted</>
              ) : (
                <><Bell className="mr-2 h-4 w-4" /> Notify Me</>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a batch to enroll" />
                </SelectTrigger>
                <SelectContent>
                  {course.batches.map((batch: any) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batchName} ({batch.status.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <RazorpayCheckoutButton
                type="course"
                itemId={course.id}
                batchId={selectedBatch}
                itemName={course.name}
                studentId={student.id}
                studentName={student.name}
                studentEmail={student.email || undefined}
                studentPhone={student.phone}
                totalFee={course.totalFee}
                paidAmount={0}
                isNewEnrollment={true}
                buttonText="Enroll & Pay"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
