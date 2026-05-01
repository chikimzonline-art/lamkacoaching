'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap,
  Clock,
  ArrowRight,
  Building2,
  Loader2,
  Search,
  Calculator,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';

interface Department {
  id: string;
  name: string;
  courses: {
    id: string;
    name: string;
    duration: string | null;
    totalFee: number;
    description: string | null;
  }[];
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function CoursesPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/public/courses')
      .then((r) => r.json())
      .then((data) => {
        // Filter out Computer Training - it has its own dedicated page
        const competitiveOnly = (data.departments || []).filter(
          (d: Department) => d.name !== 'Computer Training'
        );
        setDepartments(competitiveOnly);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredDepartments = departments
    .filter((d) => activeDept === 'all' || d.id === activeDept)
    .map((d) => ({
      ...d,
      courses: d.courses.filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((d) => d.courses.length > 0);

  const totalCourses = departments.reduce((sum, d) => sum + d.courses.length, 0);

  // Get all courses flat for the calculator
  const allCourses = departments.flatMap((d) =>
    d.courses.map((c) => ({ ...c, departmentName: d.name }))
  );

  const selectedTotal = allCourses
    .filter((c) => selectedCourseIds.has(c.id))
    .reduce((sum, c) => sum + c.totalFee, 0);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-cyan-600 to-sky-500 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Competitive Exam Courses</h1>
          <p className="mt-2 text-cyan-100 text-lg max-w-xl mx-auto">
            Expert coaching programs for SSC, Banking, UPSC, Railway and other government exams
          </p>
          <div className="mt-4 text-sm text-cyan-200">
            {totalCourses} course{totalCourses !== 1 ? 's' : ''} across {departments.length} department{departments.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveDept('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  activeDept === 'all'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                All Departments
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setActiveDept(dept.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    activeDept === dept.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Calculator */}
          {!loading && allCourses.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="flex items-center gap-2 text-gray-900 font-semibold text-lg hover:text-cyan-700 transition-colors w-full"
              >
                <Calculator className="h-5 w-5 text-cyan-600" />
                Calculate Total Fee
                <span
                  className={cn(
                    'ml-auto text-sm font-normal transition-transform duration-300',
                    showCalculator ? 'rotate-180' : ''
                  )}
                >
                  ▾
                </span>
              </button>

              <AnimatePresence>
                {showCalculator && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2">
                      {allCourses.map((course) => (
                        <label
                          key={course.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                            selectedCourseIds.has(course.id)
                              ? 'bg-cyan-50 border border-cyan-200'
                              : 'bg-white border border-gray-100 hover:bg-gray-50'
                          )}
                        >
                          <Checkbox
                            checked={selectedCourseIds.has(course.id)}
                            onCheckedChange={() => toggleCourse(course.id)}
                          />
                          <span className="flex-1 text-sm font-medium text-gray-900">
                            {course.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-600 text-xs"
                          >
                            {course.departmentName}
                          </Badge>
                          <span className="text-sm font-bold text-cyan-700 min-w-[70px] text-right">
                            {formatCurrency(course.totalFee)}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="mt-4 bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          Estimated Total Fee
                          {selectedCourseIds.size > 0 && (
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              ({selectedCourseIds.size} course{selectedCourseIds.size !== 1 ? 's' : ''})
                            </span>
                          )}
                        </span>
                        <span className="text-2xl font-bold text-cyan-700">
                          {formatCurrency(selectedTotal)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Fees are indicative. Actual fees may vary. Contact us for installment options.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <Skeleton className="h-5 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Course Cards */}
          {!loading && filteredDepartments.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
            </div>
          )}

          {!loading &&
            filteredDepartments.map((dept) => (
              <div key={dept.id} className="mb-10 last:mb-0">
                <div className="flex items-center gap-2 mb-5">
                  <Building2 className="h-4 w-4 text-cyan-600" />
                  <h2 className="text-xl font-bold text-gray-900">{dept.name}</h2>
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-700">
                    {dept.courses.length} course{dept.courses.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dept.courses.map((course) => (
                    <Card
                      key={course.id}
                      className="border border-gray-100 hover:border-cyan-200 hover:shadow-md transition-all group"
                    >
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors leading-snug">
                            {course.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2.5">
                          {course.duration && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {course.duration}
                            </span>
                          )}
                          <span className="text-base font-bold text-cyan-700">
                            {formatCurrency(course.totalFee)}
                          </span>
                        </div>

                        {course.description && (
                          <p className="mt-2.5 text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
                            {course.description}
                          </p>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-50">
                          <Link href={`/register?courseId=${course.id}`}>
                            <Button
                              size="sm"
                              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
                            >
                              Enroll Now
                              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    </PublicLayout>
  );
}
