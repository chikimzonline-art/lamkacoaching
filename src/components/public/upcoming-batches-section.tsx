'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CalendarDays,
  Clock,
  Users,
  Hourglass,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Batch Data
   ───────────────────────────────────────────── */

type DepartmentColor = 'blue' | 'cyan' | 'green';

interface BatchData {
  name: string;
  department: string;
  departmentColor: DepartmentColor;
  startDate: string;
  timing: string;
  duration: string;
  seats: number;
  seatsLabel: string;
  seatsColor: 'green' | 'orange' | 'red';
  status: string;
  statusColor: 'green' | 'orange' | 'red';
}

const batches: BatchData[] = [
  {
    name: 'SSC CGL 2025 Batch',
    department: 'Competitive Exams',
    departmentColor: 'blue',
    startDate: 'June 15, 2025',
    timing: 'Morning Batch: 7:00 AM – 10:00 AM',
    duration: '6 Months',
    seats: 12,
    seatsLabel: '12 seats remaining',
    seatsColor: 'green',
    status: 'Enrolling Now',
    statusColor: 'green',
  },
  {
    name: 'CCC Computer Course',
    department: 'Computer Training',
    departmentColor: 'cyan',
    startDate: 'June 1, 2025',
    timing: 'Afternoon Batch: 12:00 PM – 3:00 PM',
    duration: '3 Months',
    seats: 8,
    seatsLabel: '8 seats remaining',
    seatsColor: 'green',
    status: 'Enrolling Now',
    statusColor: 'green',
  },
  {
    name: 'Tally Prime with GST',
    department: 'Computer Training',
    departmentColor: 'cyan',
    startDate: 'June 20, 2025',
    timing: 'Evening Batch: 4:00 PM – 7:00 PM',
    duration: '2 Months',
    seats: 5,
    seatsLabel: '5 seats remaining',
    seatsColor: 'orange',
    status: 'Almost Full',
    statusColor: 'orange',
  },
  {
    name: 'IBPS PO 2025',
    department: 'Banking Exams',
    departmentColor: 'green',
    startDate: 'July 1, 2025',
    timing: 'Morning Batch: 7:00 AM – 10:00 AM',
    duration: '4 Months',
    seats: 15,
    seatsLabel: '15 seats remaining',
    seatsColor: 'green',
    status: 'Enrolling Now',
    statusColor: 'green',
  },
  {
    name: 'Web Design & Development',
    department: 'Computer Training',
    departmentColor: 'cyan',
    startDate: 'July 10, 2025',
    timing: 'Evening Batch: 4:00 PM – 7:00 PM',
    duration: '4 Months',
    seats: 10,
    seatsLabel: '10 seats remaining',
    seatsColor: 'green',
    status: 'Enrolling Now',
    statusColor: 'green',
  },
  {
    name: 'Advanced Excel',
    department: 'Computer Training',
    departmentColor: 'cyan',
    startDate: 'June 5, 2025',
    timing: 'Afternoon Batch: 12:00 PM – 3:00 PM',
    duration: '1 Month',
    seats: 3,
    seatsLabel: '3 seats remaining',
    seatsColor: 'red',
    status: 'Last Few Seats',
    statusColor: 'red',
  },
];

/* ─────────────────────────────────────────────
   Color Mappings
   ───────────────────────────────────────────── */

const departmentGradients: Record<DepartmentColor, string> = {
  blue: 'from-blue-500 to-sky-400',
  cyan: 'from-cyan-500 to-sky-400',
  green: 'from-green-500 to-emerald-400',
};

const statusBadgeStyles: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
};

const seatsColorStyles: Record<string, string> = {
  green: 'text-green-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
};

/* ─────────────────────────────────────────────
   Upcoming Batches Section Component
   ───────────────────────────────────────────── */

export default function UpcomingBatchesSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="mb-3 bg-green-100 text-green-700">
            <Calendar className="h-3 w-3 mr-1" /> New Batches
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Upcoming Batch Schedule
          </h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
            New batches starting soon. Enroll early to secure your seat.
          </p>
        </div>

        {/* Batch Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Top colored bar */}
              <div className={`h-1.5 bg-gradient-to-r ${departmentGradients[batch.departmentColor]}`} />

              {/* Content */}
              <div className="p-5">
                {/* Status badge — top right */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[11px]">
                    {batch.department}
                  </Badge>
                  <Badge className={`text-[10px] px-2 py-0.5 ${statusBadgeStyles[batch.statusColor]}`}>
                    {batch.status}
                  </Badge>
                </div>

                {/* Course name */}
                <h3 className="font-bold text-gray-900 text-lg mb-3 leading-snug">
                  {batch.name}
                </h3>

                {/* Info rows */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{batch.startDate}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{batch.timing}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Hourglass className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{batch.duration}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className={`text-sm font-medium ${seatsColorStyles[batch.seatsColor]}`}>
                      {batch.seatsLabel}
                    </span>
                  </div>
                </div>

                {/* Enroll button */}
                <Link href="/register#" className="block">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl">
                    <GraduationCap className="h-4 w-4 mr-1.5" />
                    Enroll Now
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-gray-500 mb-4 text-lg">
            Can&apos;t find a suitable batch?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/about">
              <Button variant="outline" className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl">
                Contact Us
              </Button>
            </Link>
            <Link href="/courses">
              <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">
                View All Courses <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
