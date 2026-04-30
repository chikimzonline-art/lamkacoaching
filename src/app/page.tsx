'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  DoorOpen,
  Users,
  Clock,
  Award,
  ArrowRight,
  Megaphone,
  Pin,
  Monitor,
  Keyboard,
  Code2,
  Table2,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  Target,
  Sparkles,
  Phone,
  MapPin,
  ChevronRight,
  Zap,
  Shield,
  Laptop,
} from 'lucide-react';

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

interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

interface SiteSettings {
  heroBadgeText?: string;
  heroBannerText?: string;
  footerCtaTitle?: string;
  footerCtaSubtitle?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/courses').then((r) => r.json()),
      fetch('/api/public/notices').then((r) => r.json()),
      fetch('/api/public/settings').then((r) => r.json()),
    ])
      .then(([coursesData, noticesData, settingsData]) => {
        setDepartments(coursesData.departments || []);
        setNotices((noticesData.notices || []).slice(0, 4));
        setSiteSettings(settingsData.settings || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCourses = departments.reduce((sum, d) => sum + d.courses.length, 0);
  const computerDept = departments.find((d) => d.name === 'Computer Training');
  const otherDepts = departments.filter((d) => d.name !== 'Computer Training');

  // Dynamic text from settings with fallbacks
  const heroBadgeText = siteSettings.heroBadgeText || 'Admissions Open 2025-26';
  const heroBannerText = siteSettings.heroBannerText || 'New batches starting soon!';

  return (
    <PublicLayout>
      {/* ============================================
          HERO — Full viewport, split layout
          ============================================ */}
      <section className="relative min-h-[90vh] flex items-center bg-gray-950 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/90 via-cyan-700/90 to-sky-800/90" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%), radial-gradient(circle at 60% 80%, rgba(255,255,255,0.03) 0%, transparent 40%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                <span className="text-sm font-medium text-sky-100">{heroBadgeText}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Build Your
                <br />
                <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">Future</span> With Us
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-cyan-100/80 leading-relaxed max-w-lg">
                Competitive exam coaching, professional computer training, and focused study spaces — everything you need to succeed, all in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg" className="h-13 px-7 bg-white text-gray-900 hover:bg-cyan-50 font-bold text-base shadow-xl shadow-black/20 rounded-xl">
                    Enroll Free
                    <ArrowRight className="h-4.5 w-4.5 ml-2" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="h-13 px-7 bg-transparent border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base rounded-xl">
                    View Courses
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Floating stat cards */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Lamka Coaching Center</h3>
                      <p className="text-cyan-200 text-sm">Center of Excellence</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Courses', value: totalCourses || '10+', icon: <GraduationCap className="h-4 w-4" /> },
                      { label: 'Departments', value: departments.length || '5', icon: <Target className="h-4 w-4" /> },
                      { label: 'Study Cabins', value: '20+', icon: <DoorOpen className="h-4 w-4" /> },
                      { label: 'IT Programs', value: computerDept?.courses.length || '6', icon: <Laptop className="h-4 w-4" /> },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 text-cyan-200 mb-1">
                          {stat.icon}
                          <span className="text-xs">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating accent card */}
                <div className="absolute -bottom-4 -left-4 bg-sky-500 text-gray-900 rounded-xl px-5 py-3 shadow-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-bold">{heroBannerText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ============================================
          TRUST BAR — Quick trust signals
          ============================================ */}
      <section className="py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500">
            {[
              { icon: <Shield className="h-4 w-4 text-green-600" />, text: 'Govt. Recognized Courses' },
              { icon: <Users className="h-4 w-4 text-cyan-600" />, text: '500+ Students Trained' },
              { icon: <Award className="h-4 w-4 text-blue-600" />, text: 'Experienced Faculty' },
              { icon: <CheckCircle2 className="h-4 w-4 text-purple-600" />, text: 'Affordable Fee Structure' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                {item.icon}
                <span className="font-medium text-gray-600">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT WE OFFER — 3-pillar layout
          ============================================ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-3 bg-cyan-100 text-cyan-700">Our Programs</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Three Paths. One Destination.
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
              Whether you&apos;re preparing for government exams, learning computer skills, or need a quiet place to study — we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Competitive Exams */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Competitive Exam Coaching</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Expert preparation for SSC, Banking, UPSC, and Railway exams with structured curriculum, regular mock tests, and result-oriented teaching methodology.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['SSC CGL', 'IBPS', 'SBI PO', 'UPSC', 'Railway'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{tag}</span>
                ))}
              </div>
              <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 group-hover:gap-2 transition-all">
                Explore Courses <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Card 2: Computer Training */}
            <div className="group relative bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-cyan-100/50 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <Badge className="bg-cyan-600 text-white text-[10px]">Popular</Badge>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-cyan-200">
                <Monitor className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Computer Training Center</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                From basic computer literacy to professional IT skills — CCC, Tally Prime with GST, Advanced Excel, Web Development, Python, and bilingual typing courses.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['CCC', 'Tally', 'Excel', 'Web Design', 'Python', 'Typing'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-md text-xs font-medium">{tag}</span>
                ))}
              </div>
              <Link href="/computer-training" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 group-hover:gap-2 transition-all">
                Explore Programs <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Card 3: Study Cabins */}
            <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-green-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-green-200">
                <DoorOpen className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Study Cabin Spaces</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Dedicated quiet study spaces with comfortable seating, proper lighting, and flexible timings. Available on hourly or monthly basis with affordable pricing.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['Hourly', 'Monthly', 'AC Rooms', 'Wi-Fi', 'Flexible'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium">{tag}</span>
                ))}
              </div>
              <Link href="/cabins" className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 group-hover:gap-2 transition-all">
                Book a Cabin <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          COMPUTER TRAINING — Dedicated feature section
          ============================================ */}
      {!loading && computerDept && (
        <section className="py-20 sm:py-28 bg-gray-950 relative overflow-hidden">
          {/* Background accents */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(6,182,212,0.05) 0%, transparent 40%)' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-14">
              <div className="max-w-xl">
                <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  <Monitor className="h-3 w-3 mr-1" /> Computer Training Center
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Learn. Code. <span className="text-cyan-400">Create.</span>
                </h2>
                <p className="mt-3 text-gray-400 text-lg leading-relaxed">
                  Gain the digital skills that employers actually want. From basic computer operations to professional programming — we have a course for every level.
                </p>
              </div>
              <Link href="/computer-training">
                <Button variant="outline" className="gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 shrink-0 rounded-xl">
                  All Programs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Quick-skill badges */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-10">
              {[
                { icon: <Keyboard className="h-5 w-5" />, label: 'CCC', fee: '₹5,000' },
                { icon: <Table2 className="h-5 w-5" />, label: 'Tally + GST', fee: '₹6,000' },
                { icon: <Table2 className="h-5 w-5" />, label: 'Adv. Excel', fee: '₹4,000' },
                { icon: <Code2 className="h-5 w-5" />, label: 'Web Design', fee: '₹15,000' },
                { icon: <Code2 className="h-5 w-5" />, label: 'Python', fee: '₹12,000' },
                { icon: <Keyboard className="h-5 w-5" />, label: 'Typing', fee: '₹2,500' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-default">
                  <div className="text-cyan-400 mb-2">{item.icon}</div>
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.fee}</span>
                </div>
              ))}
            </div>

            {/* Course cards on dark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {computerDept.courses.slice(0, 6).map((course) => (
                <div key={course.id} className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug">{course.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {course.duration && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </span>
                    )}
                    <span className="text-sm font-bold text-cyan-400">{formatCurrency(course.totalFee)}</span>
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                  )}
                  <Link href={`/register?courseId=${course.id}`}>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg">
                      Enroll Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          COMPETITIVE EXAMS COURSES
          ============================================ */}
      {!loading && otherDepts.some((d) => d.courses.length > 0) && (
        <section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700">Competitive Exams</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Crack the Exam. Get the Job.</h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
                Structured coaching programs designed to help you clear government exams with confidence and proven strategies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherDepts.filter((d) => d.courses.length > 0).flatMap((dept) =>
                dept.courses.map((course) => (
                  <Card key={course.id} className="border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 to-sky-400" />
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {course.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5">
                          {dept.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {course.duration && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                        )}
                        <span className="text-sm font-bold text-blue-700">
                          {formatCurrency(course.totalFee)}
                        </span>
                      </div>
                      {course.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{course.description}</p>
                      )}
                      <Link href={`/register?courseId=${course.id}`}>
                        <Button size="sm" variant="ghost" className="mt-3 text-blue-700 hover:text-blue-800 hover:bg-blue-50 p-0 h-auto font-semibold">
                          Enroll Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="mt-8 text-center">
              <Link href="/courses">
                <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl">
                  View All Courses <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Loading */}
      {loading && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-cyan-100 text-cyan-600 animate-pulse mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-sm text-gray-400">Loading courses...</p>
          </div>
        </section>
      )}

      {/* ============================================
          NOTICES — Clean announcement ticker
          ============================================ */}
      {!loading && notices.length > 0 && (
        <section className="py-20 sm:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <Badge variant="secondary" className="mb-3 bg-sky-100 text-sky-700">Announcements</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Latest Notices</h2>
              </div>
              <Link href="/notices">
                <Button variant="outline" size="sm" className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-xl hidden sm:flex">
                  All Notices <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((notice) => (
                <Card key={notice.id} className={`rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow ${notice.pinned ? 'ring-2 ring-cyan-200 bg-cyan-50/30' : 'bg-white'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {notice.pinned && (
                        <Badge className="bg-cyan-100 text-cyan-700 text-[10px] px-1.5 rounded-md">
                          <Pin className="h-2.5 w-2.5 mr-0.5" /> Important
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(notice.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{notice.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{notice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link href="/notices">
                <Button variant="outline" size="sm" className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-xl">
                  All Notices <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          WHY CHOOSE US — Bento grid
          ============================================ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3 bg-purple-100 text-purple-700">Why Lamka?</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why Students Choose Us</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
              We don&apos;t just teach — we mentor, guide, and walk alongside you until you reach your goal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Award className="h-6 w-6" />,
                title: 'Experienced Faculty',
                desc: 'Teachers with years of domain expertise and a proven track record of producing successful candidates in competitive examinations year after year.',
                accent: 'from-cyan-500 to-sky-500',
                bg: 'bg-cyan-50',
              },
              {
                icon: <CheckCircle2 className="h-6 w-6" />,
                title: 'Affordable Fees',
                desc: 'Quality education shouldn\'t break the bank. Our fee structure is transparent, reasonable, and designed to be accessible to students from all backgrounds.',
                accent: 'from-green-500 to-emerald-500',
                bg: 'bg-green-50',
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: 'Flexible Batch Timings',
                desc: 'Morning, afternoon, and evening batches so you can learn at a time that suits your schedule. Weekend batches available for working professionals.',
                accent: 'from-blue-500 to-cyan-500',
                bg: 'bg-blue-50',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Small Batch Sizes',
                desc: 'Limited seats per batch means every student gets individual attention, their doubts are resolved faster, and learning is more interactive and effective.',
                accent: 'from-purple-500 to-violet-500',
                bg: 'bg-purple-50',
              },
              {
                icon: <DoorOpen className="h-6 w-6" />,
                title: 'Dedicated Study Spaces',
                desc: 'Quiet, comfortable study cabins with proper lighting and flexible booking options. An environment designed for maximum focus and productivity.',
                accent: 'from-teal-500 to-green-500',
                bg: 'bg-teal-50',
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: 'Result-Oriented Approach',
                desc: 'Regular mock tests, progress tracking, performance analysis, and personalized feedback ensure you stay on the right path throughout your preparation journey.',
                accent: 'from-rose-500 to-pink-500',
                bg: 'bg-rose-50',
              },
            ].map((feature) => (
              <div key={feature.title} className={`${feature.bg} border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow`}>
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${feature.accent} text-white mb-4 shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CTA — Strong final push
          ============================================ */}
      <section className="py-20 sm:py-28 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 60%)' }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Your Success Story
            <br />
            <span className="bg-gradient-to-r from-sky-300 to-cyan-400 bg-clip-text text-transparent">Starts Here</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
            Join hundreds of students who turned their aspirations into achievements with Lamka Coaching Center. Take the first step today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="h-13 px-8 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold text-base shadow-xl shadow-cyan-900/30 rounded-xl">
                Register for Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="h-13 px-8 bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/30 font-semibold text-base rounded-xl">
                Browse Courses
              </Button>
            </Link>
          </div>

          {/* Contact hint - using dynamic settings */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {siteSettings.businessPhone ? (
              <a href={`tel:${siteSettings.businessPhone}`} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                <Phone className="h-4 w-4 text-cyan-400" />
                <span>{siteSettings.businessPhone}</span>
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan-400" />
                <span>Call us for queries</span>
              </div>
            )}
            {siteSettings.businessAddress ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span>{siteSettings.businessAddress}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span>Visit our center in Lamka</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
