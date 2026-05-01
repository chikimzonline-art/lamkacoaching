'use client';

import Link from 'next/link';
import { Clock, Wallet, GraduationCap, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CourseDetail {
  id: string;
  name: string;
  duration: string | null;
  totalFee: number;
  description: string | null;
  departmentName: string;
}

interface CourseDetailModalProps {
  course: CourseDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

// Generate highlights from course description
function generateHighlights(course: CourseDetail): string[] {
  const highlights: string[] = [];

  if (course.duration) {
    highlights.push(`Course Duration: ${course.duration}`);
  }
  highlights.push(`Fee: ${formatINR(course.totalFee)}`);
  highlights.push(`Department: ${course.departmentName}`);

  if (course.description) {
    // Extract key phrases from description
    const sentences = course.description.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, 4).map(s => s.trim());
    highlights.push(...keyPoints);
  }

  // Add common highlights
  highlights.push('Experienced and dedicated faculty');
  highlights.push('Regular mock tests and assessments');

  return highlights.slice(0, 6);
}

export default function CourseDetailModal({ course, open, onOpenChange }: CourseDetailModalProps) {
  const highlights = generateHighlights(course);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500" />

        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                {course.departmentName}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {course.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details for the {course.name} course in {course.departmentName} department
            </DialogDescription>
          </DialogHeader>

          {/* Key info row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="flex flex-col items-center p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
              <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mb-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Duration</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                {course.duration || 'Flexible'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-100 dark:border-green-900/40">
              <Wallet className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Fee</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                {formatINR(course.totalFee)}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Department</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5 text-center leading-tight">
                {course.departmentName}
              </span>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                About This Course
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {course.description}
              </p>
            </div>
          )}

          {/* Highlights */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Highlights</h4>
            <ul className="space-y-2">
              {highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/register?courseId=${course.id}`} className="flex-1">
              <Button className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
                Register Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Compare
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
