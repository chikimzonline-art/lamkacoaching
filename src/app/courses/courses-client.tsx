'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Clock,
  ArrowRight,
  Building2,
  Search,
  Calculator,
  GitCompareArrows,
  X,
  Banknote,
  BookOpen,
  CreditCard,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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

export default function CoursesClient({ initialDepartments }: { initialDepartments: Department[] }) {
  const departments = initialDepartments;
  const [activeDept, setActiveDept] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    name: string;
    duration: string | null;
    totalFee: number;
    description: string | null;
    departmentName: string;
  } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'fee-low' | 'fee-high' | 'duration'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDepartments = departments
    .filter((d) => activeDept === 'all' || d.id === activeDept)
    .map((d) => ({
      ...d,
      courses: d.courses
        .filter(
          (c) =>
            !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
          switch (sortBy) {
            case 'fee-low': return a.totalFee - b.totalFee;
            case 'fee-high': return b.totalFee - a.totalFee;
            case 'duration': return (a.duration || '').localeCompare(b.duration || '');
            default: return a.name.localeCompare(b.name);
          }
        }),
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

  const toggleCompare = (courseId: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else if (next.size < 3) {
        next.add(courseId);
      }
      return next;
    });
  };

  const clearCompare = () => {
    setCompareIds(new Set());
  };

  // Courses selected for comparison, with department info
  const compareCourses = allCourses.filter((c) => compareIds.has(c.id));

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

      <section className="py-8 sm:py-12 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters & Sort Bar */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="name">Sort: A-Z</option>
                    <option value="fee-low">Fee: Low to High</option>
                    <option value="fee-high">Fee: High to Low</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
                {/* View Mode Toggle */}
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 transition-colors',
                      viewMode === 'grid'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    )}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 transition-colors',
                      viewMode === 'list'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    )}
                    title="List view"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            {/* Department Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveDept('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  activeDept === 'all'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Calculator */}
          {allCourses.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold text-lg hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors w-full"
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
                              ? 'bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800'
                              : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                          )}
                        >
                          <Checkbox
                            checked={selectedCourseIds.has(course.id)}
                            onCheckedChange={() => toggleCourse(course.id)}
                          />
                          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {course.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs"
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
                    <div className="mt-4 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          Estimated Total Fee
                          {selectedCourseIds.size > 0 && (
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                              ({selectedCourseIds.size} course{selectedCourseIds.size !== 1 ? 's' : ''})
                            </span>
                          )}
                        </span>
                        <span className="text-2xl font-bold text-cyan-700">
                          {formatCurrency(selectedTotal)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Fees are indicative. Actual fees may vary. Contact us for installment options.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Course Cards */}
          {filteredDepartments.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No courses found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
          )}

          {filteredDepartments.map((dept) => (
            <div key={dept.id} className="mb-10 last:mb-0">
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="h-4 w-4 text-cyan-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{dept.name}</h2>
                <Badge variant="secondary" className="bg-cyan-50 text-cyan-700">
                  {dept.courses.length} course{dept.courses.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className={cn(
                "gap-5",
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col"
              )}>
                {dept.courses.map((course) => (
                  <Card
                    key={course.id}
                    className={cn(
                      "border hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group relative cursor-pointer",
                      compareIds.has(course.id)
                        ? "border-cyan-300 dark:border-cyan-700 ring-1 ring-cyan-200 dark:ring-cyan-800"
                        : "border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-700"
                    )}
                    onClick={() => {
                      setSelectedCourse({ ...course, departmentName: dept.name });
                      setDetailOpen(true);
                    }}
                  >
                    {/* Compare checkbox */}
                    <div className="absolute top-3 right-3 z-10">
                      <label
                        className="flex items-center gap-1.5 cursor-pointer"
                        title={compareIds.has(course.id) ? 'Remove from comparison' : compareIds.size >= 3 ? 'Max 3 courses for comparison' : 'Add to comparison'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={compareIds.has(course.id)}
                          onCheckedChange={() => toggleCompare(course.id)}
                          disabled={!compareIds.has(course.id) && compareIds.size >= 3}
                          className={cn(
                            "transition-colors",
                            compareIds.has(course.id)
                              ? "border-cyan-500 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                              : ""
                          )}
                        />
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 select-none">Compare</span>
                      </label>
                    </div>
                    <CardContent className={cn(
                      "p-5 flex h-full",
                      viewMode === 'list'
                        ? "flex-row items-center gap-4"
                        : "flex-col"
                    )}>
                      <div className={cn("flex items-start justify-between gap-2", viewMode === 'list' ? "flex-1 min-w-0" : "pr-16")}>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                          {course.name}
                        </h3>
                      </div>

                      <div className={cn("flex items-center gap-3 mt-2.5", viewMode === 'list' ? "shrink-0" : "flex-wrap")}>
                        {course.duration && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                        )}
                        <span className="text-base font-bold text-cyan-700 dark:text-cyan-400">
                          {formatCurrency(course.totalFee)}
                        </span>
                      </div>

                      {course.description && (
                        <p className={cn(
                          "text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1",
                          viewMode === 'list' ? "mt-0 ml-4 line-clamp-1" : "mt-2.5 line-clamp-2"
                        )}>
                          {course.description}
                        </p>
                      )}

                      <div className={cn(
                        "mt-4 pt-3 border-t border-gray-50 dark:border-gray-700",
                        viewMode === 'list' ? "mt-0 pt-0 border-t-0 border-l-0 ml-4 shrink-0" : ""
                      )}>
                        <Link href={`/register?courseId=${course.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium whitespace-nowrap"
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

      {/* Floating Compare Button */}
      <AnimatePresence>
        {compareIds.size > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => setCompareOpen(true)}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-2xl shadow-xl shadow-cyan-600/25 transition-colors"
          >
            <GitCompareArrows className="h-4.5 w-4.5" />
            Compare ({compareIds.size})
          </motion.button>
        )}
      </AnimatePresence>

      {/* Comparison Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <GitCompareArrows className="h-5 w-5 text-cyan-600" />
              Course Comparison
            </DialogTitle>
            <DialogDescription>
              Compare up to 3 courses side by side
            </DialogDescription>
          </DialogHeader>

          {compareCourses.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 rounded-tl-lg w-32 shrink-0">
                      Attribute
                    </th>
                    {compareCourses.map((course) => (
                      <th key={course.id} className="p-3 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-gray-100 min-w-[180px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="line-clamp-2">{course.name}</span>
                          <button
                            onClick={() => toggleCompare(course.id)}
                            className="shrink-0 h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 flex items-center justify-center transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100 dark:border-gray-700">
                    <td className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</td>
                    {compareCourses.map((course) => (
                      <td key={course.id} className="p-3 text-sm text-gray-900 dark:text-gray-100">
                        <Badge variant="secondary" className="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 text-xs">
                          {course.departmentName}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                    <td className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Duration</td>
                    {compareCourses.map((course) => (
                      <td key={course.id} className="p-3 text-sm text-gray-900 dark:text-gray-100">
                        {course.duration ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {course.duration}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-100 dark:border-gray-700">
                    <td className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total Fee</td>
                    {compareCourses.map((course) => (
                      <td key={course.id} className="p-3 text-sm font-bold text-cyan-700 dark:text-cyan-400">
                        {formatCurrency(course.totalFee)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                    <td className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400 align-top">Description</td>
                    {compareCourses.map((course) => (
                      <td key={course.id} className="p-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed align-top">
                        {course.description || <span className="text-gray-400">No description available</span>}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <GitCompareArrows className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Select courses to compare</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompare}
              className="text-gray-500 hover:text-red-600 hover:border-red-200"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear All
            </Button>
            <div className="text-xs text-gray-400">
              {compareIds.size}/3 courses selected
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) { setDetailOpen(false); setSelectedCourse(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] rounded-2xl bg-white dark:bg-gray-900 border-0 p-0 overflow-hidden" showCloseButton={true}>
          {/* Gradient Top Bar */}
          <div className="h-2 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-600" />

          <div className="p-6 sm:p-7 overflow-y-auto max-h-[calc(90vh-0.5rem)]">
            <DialogHeader className="mb-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 pr-8 leading-tight">
                {selectedCourse?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Course details for {selectedCourse?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedCourse && (
              <div className="mt-4 space-y-5">
                {/* Department Badge */}
                <Badge variant="secondary" className="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 text-sm px-3 py-1">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  {selectedCourse.departmentName}
                </Badge>

                {/* Info Rows */}
                <div className="space-y-3">
                  {/* Duration */}
                  {selectedCourse.duration && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedCourse.duration}</p>
                      </div>
                    </div>
                  )}

                  {/* Fee Breakdown */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <Banknote className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Course Fee</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(selectedCourse.totalFee)}</p>
                    </div>
                  </div>

                  {/* Installment Note */}
                  <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      Easy installment options available. Pay in 2–3 installments. Contact us for flexible payment plans.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">About This Course</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedCourse.description || 'Comprehensive coaching program designed to help you achieve your goals with expert guidance and structured curriculum.'}
                      </p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 shrink-0">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">What You&apos;ll Get</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          Expert faculty & structured curriculum
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          Regular mock tests & performance tracking
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          Study materials & doubt-clearing sessions
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <Link href={`/register?courseId=${selectedCourse.id}`} className="block" onClick={(e) => e.stopPropagation()}>
                    <Button
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-base h-12 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                    >
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Enroll Now
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailOpen(false);
                      setSelectedCourse(null);
                      // Scroll to courses section so user can compare
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center gap-1.5 w-full text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium py-2 transition-colors"
                  >
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    Compare with other courses
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
