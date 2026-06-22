'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Clock,
  ArrowRight,
  Keyboard,
  Code2,
  Table2,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Users,
  Award,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  return `\u20B9${(paise / 100).toLocaleString('en-IN')}`;
}

const skillHighlights = [
  { icon: <Keyboard className="h-5 w-5" />, label: 'Typing', desc: 'Hindi & English' },
  { icon: <Monitor className="h-5 w-5" />, label: 'CCC', desc: 'Govt. Certified' },
  { icon: <Table2 className="h-5 w-5" />, label: 'Tally + GST', desc: 'Accounting' },
  { icon: <Table2 className="h-5 w-5" />, label: 'Adv. Excel', desc: 'Data Analysis' },
  { icon: <Code2 className="h-5 w-5" />, label: 'Web Design', desc: 'Full Stack' },
  { icon: <Code2 className="h-5 w-5" />, label: 'Python', desc: 'Programming' },
];

const whyChooseItems = [
  { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Hands-On Practice', desc: 'Learn by doing with practical exercises and real-world projects on every course.' },
  { icon: <Award className="h-5 w-5" />, title: 'Certified Courses', desc: 'Get recognized certifications that add value to your resume and career prospects.' },
  { icon: <Users className="h-5 w-5" />, title: 'Expert Instructors', desc: 'Learn from experienced professionals who bring industry knowledge to the classroom.' },
  { icon: <GraduationCap className="h-5 w-5" />, title: 'Job-Ready Skills', desc: 'Curriculum designed around what employers actually need in the current job market.' },
];

export default function ComputerTrainingClient({ initialDepartment }: { initialDepartment: Department | null }) {
  const [search, setSearch] = useState('');
  const computerDept = initialDepartment;

  const filteredCourses = computerDept
    ? computerDept.courses.filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <PublicLayout>
      {/* ============================================
          HERO — Dark themed header
          ============================================ */}
      <section className="relative py-16 sm:py-24 bg-gray-950 overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/90 via-cyan-700/90 to-sky-800/90" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%), radial-gradient(circle at 60% 80%, rgba(255,255,255,0.03) 0%, transparent 40%)',
            }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/10 text-sky-100 border-white/20">
            <Monitor className="h-3.5 w-3.5 mr-1.5" /> Computer Training Center
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Learn. Code.{' '}
            <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Create.
            </span>
          </h1>
          <p className="mt-4 text-cyan-100/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            From basic computer literacy to professional IT skills — gain the digital skills that
            employers actually want. We have a course for every level.
          </p>
          <div className="mt-5 text-sm text-cyan-200">
            {computerDept
              ? `${computerDept.courses.length} professional programs available`
              : '0 professional programs available'}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-950 to-transparent" />
      </section>

      {/* ============================================
          SKILL BADGES — Quick overview
          ============================================ */}
      <section className="relative -mt-6 pb-12 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {skillHighlights.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-default"
              >
                <div className="text-cyan-400 mb-2">{item.icon}</div>
                <span className="text-sm font-semibold text-white">{item.label}</span>
                <span className="text-xs text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          COURSES — Search + Cards
          ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Our Programs</h2>
              <p className="mt-1 text-gray-400">
                Choose the right course for your career goals
              </p>
            </div>
            <div className="relative max-w-xs w-full">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* No courses */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <Monitor className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white">No programs found</h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
            </div>
          )}

          {/* Course Cards */}
          {filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {course.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {course.duration && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </span>
                    )}
                    <span className="text-sm font-bold text-cyan-400">
                      {formatCurrency(course.totalFee)}
                    </span>
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                      {course.description}
                    </p>
                  )}
                  <Link href={`/register?courseId=${course.id}`}>
                    <Button
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg"
                    >
                      Enroll Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          WHY CHOOSE US
          ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Our Computer Training?</h2>
            <p className="mt-2 text-gray-400 max-w-lg mx-auto">
              Practical, job-oriented programs that prepare you for the real world
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyChooseItems.map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-cyan-500/20 transition-all"
              >
                <div className="text-cyan-400 mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CTA — Enroll prompt
          ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-950 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to Build Your{' '}
            <span className="text-cyan-400">Digital Skills</span>?
          </h2>
          <p className="mt-3 text-gray-400 leading-relaxed max-w-lg mx-auto">
            Join our computer training programs and take the first step towards a successful career
            in technology. New batches starting soon!
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/30"
              >
                Enroll Now <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 hover:border-white/30 rounded-xl"
              >
                View Competitive Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
