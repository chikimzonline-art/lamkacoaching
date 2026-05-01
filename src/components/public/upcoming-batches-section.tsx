'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  CalendarDays,
  Clock,
  Users,
  Hourglass,
  ArrowRight,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Batch Data Types
   ───────────────────────────────────────────── */

type DepartmentColor = 'blue' | 'cyan' | 'green';

interface BatchData {
  id: string;
  courseName: string;
  department: string;
  startDate: string;
  duration: string;
  timing: string;
  seats: number;
  status: string;
  fee: number;
  description?: string | null;
}

/* ─────────────────────────────────────────────
   Helper Functions
   ───────────────────────────────────────────── */

function getDepartmentColor(department: string): DepartmentColor {
  const lower = department.toLowerCase();
  if (lower.includes('competitive') || lower.includes('exam') || lower.includes('upsc') || lower.includes('ssc')) return 'blue';
  if (lower.includes('banking') || lower.includes('bank')) return 'green';
  return 'cyan';
}

function getStatusInfo(status: string): { label: string; color: 'green' | 'orange' | 'red' } {
  switch (status) {
    case 'enrolling':
      return { label: 'Enrolling Now', color: 'green' };
    case 'almost_full':
      return { label: 'Almost Full', color: 'orange' };
    case 'full':
      return { label: 'Last Few Seats', color: 'red' };
    case 'closed':
      return { label: 'Closed', color: 'red' };
    default:
      return { label: 'Enrolling Now', color: 'green' };
  }
}

function getSeatsColor(seats: number): 'green' | 'orange' | 'red' {
  if (seats <= 3) return 'red';
  if (seats <= 5) return 'orange';
  return 'green';
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/* ─────────────────────────────────────────────
   Color Mappings
   ───────────────────────────────────────────── */

const departmentGradients: Record<DepartmentColor, string> = {
  blue: 'from-blue-500 to-sky-400',
  cyan: 'from-cyan-500 to-sky-400',
  green: 'from-green-500 to-emerald-400',
};

const statusBadgeStyles: Record<string, string> = {
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const seatsColorStyles: Record<string, string> = {
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
};

/* ─────────────────────────────────────────────
   Skeleton Loader
   ───────────────────────────────────────────── */

function BatchCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
      <Skeleton className="h-1.5 w-full" />
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Upcoming Batches Section Component
   ───────────────────────────────────────────── */

export default function UpcomingBatchesSection() {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/public/batches');
        if (!res.ok) throw new Error('Failed to fetch batches');
        const data = await res.json();
        setBatches(data);
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Could not load batch schedule. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="mb-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <Calendar className="h-3 w-3 mr-1" /> New Batches
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Upcoming Batch Schedule
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            New batches starting soon. Enroll early to secure your seat.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <BatchCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && batches.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-50 dark:bg-gray-800 mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">No upcoming batches at the moment.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Check back soon or contact us for more information.</p>
          </div>
        )}

        {/* Batch Cards Grid */}
        {!loading && !error && batches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((batch) => {
              const departmentColor = getDepartmentColor(batch.department);
              const statusInfo = getStatusInfo(batch.status);
              const seatsColor = getSeatsColor(batch.seats);

              return (
                <div
                  key={batch.id}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow duration-300"
                >
                  {/* Top colored bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${departmentGradients[departmentColor]}`} />

                  {/* Content */}
                  <div className="p-5">
                    {/* Status badge — top right */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[11px]">
                        {batch.department}
                      </Badge>
                      <Badge className={`text-[10px] px-2 py-0.5 ${statusBadgeStyles[statusInfo.color]}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Course name */}
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-3 leading-snug">
                      {batch.courseName}
                    </h3>

                    {/* Info rows */}
                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-start gap-2.5">
                        <CalendarDays className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(batch.startDate)}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{batch.timing}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Hourglass className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{batch.duration}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Users className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className={`text-sm font-medium ${seatsColorStyles[seatsColor]}`}>
                          {batch.seats} {batch.seats === 1 ? 'seat' : 'seats'} remaining
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
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-lg">
            Can&apos;t find a suitable batch?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/about">
              <Button variant="outline" className="gap-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
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
