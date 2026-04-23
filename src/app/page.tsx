'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  GraduationCap,
  DoorOpen,
  Users,
  Clock,
  Award,
  ArrowRight,
  Megaphone,
  Pin,
  Star,
  TrendingUp,
  CheckCircle2,
  Loader2,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/courses').then((r) => r.json()),
      fetch('/api/public/notices').then((r) => r.json()),
    ])
      .then(([coursesData, noticesData]) => {
        setDepartments(coursesData.departments || []);
        setNotices((noticesData.notices || []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCourses = departments.reduce((sum, d) => sum + d.courses.length, 0);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500">
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 -left-16 h-48 w-48 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 right-1/3 h-36 w-36 bg-white/5 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Star className="h-3 w-3 mr-1" />
              Admissions Open for 2025-26
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Welcome to{' '}
              <span className="text-amber-200">Lamka Coaching Center</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-orange-100 leading-relaxed max-w-xl">
              Your gateway to success in competitive exams. Expert coaching for SSC, Banking, and more — with dedicated study cabins and personalized guidance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses">
                <Button size="lg" className="bg-white text-orange-700 hover:bg-orange-50 font-semibold shadow-lg shadow-orange-700/20 h-12 px-6">
                  Explore Courses
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/10 h-12 px-6 font-semibold">
                  Register Now
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-10 flex flex-wrap gap-6 sm:gap-10">
              {[
                { label: 'Courses', value: totalCourses || '10+' },
                { label: 'Departments', value: departments.length || '3+' },
                { label: 'Study Cabins', value: '20+' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-orange-200 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
              Everything you need under one roof — from competitive exam coaching to quiet study spaces
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <GraduationCap className="h-7 w-7" />,
                title: 'SSC Coaching',
                desc: 'Comprehensive preparation for SSC CGL, CHSL, MTS, and other government exams with experienced faculty and proven results.',
                color: 'bg-orange-100 text-orange-700',
              },
              {
                icon: <TrendingUp className="h-7 w-7" />,
                title: 'Banking Coaching',
                desc: 'Expert guidance for IBPS PO, Clerk, SBI, RBI, and other banking exams with regular mock tests and practice sessions.',
                color: 'bg-blue-100 text-blue-700',
              },
              {
                icon: <DoorOpen className="h-7 w-7" />,
                title: 'Study Cabins',
                desc: 'Dedicated quiet study spaces available on hourly or monthly basis. Comfortable, well-lit cabins with flexible timings.',
                color: 'bg-green-100 text-green-700',
              },
              {
                icon: <Users className="h-7 w-7" />,
                title: 'Personal Mentoring',
                desc: 'One-on-one doubt clearing sessions, personalized study plans, and regular progress tracking to keep you on track.',
                color: 'bg-purple-100 text-purple-700',
              },
            ].map((service) => (
              <Card key={service.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${service.color} mb-4`}>
                    {service.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      {!loading && departments.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Courses</h2>
                <p className="mt-1 text-gray-500">Explore our coaching programs</p>
              </div>
              <Link href="/courses">
                <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hidden sm:flex">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            {departments.map((dept) => (
              <div key={dept.id} className="mb-10 last:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {dept.name}
                  </Badge>
                  <span className="text-xs text-gray-400">{dept.courses.length} course{dept.courses.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dept.courses.slice(0, 3).map((course) => (
                    <Card key={course.id} className="border border-gray-100 hover:border-orange-200 transition-colors group">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          {course.duration && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {course.duration}
                            </span>
                          )}
                          <span className="text-sm font-bold text-orange-700">
                            {formatCurrency(course.totalFee)}
                          </span>
                        </div>
                        {course.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{course.description}</p>
                        )}
                        <Link href={`/register?courseId=${course.id}`}>
                          <Button size="sm" variant="ghost" className="mt-3 text-orange-700 hover:text-orange-800 hover:bg-orange-50 p-0 h-auto font-medium">
                            Enroll Now <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-8 text-center sm:hidden">
              <Link href="/courses">
                <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
                  View All Courses <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Loading state for courses */}
      {loading && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading courses...</p>
          </div>
        </section>
      )}

      {/* Latest Notices Section */}
      {!loading && notices.length > 0 && (
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-orange-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Latest Notices</h2>
              </div>
              <Link href="/notices">
                <Button variant="outline" size="sm" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notices.map((notice) => (
                <Card key={notice.id} className={`border-0 shadow-sm ${notice.pinned ? 'ring-2 ring-orange-200' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {notice.pinned && (
                        <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5">
                          <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(notice.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{notice.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3">{notice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Why Choose Us</h2>
            <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
              We go the extra mile to ensure every student gets the support they need
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Award className="h-6 w-6" />,
                title: 'Experienced Faculty',
                desc: 'Our teachers bring years of experience in competitive exam coaching with proven track records of student success.',
              },
              {
                icon: <CheckCircle2 className="h-6 w-6" />,
                title: 'Affordable Fees',
                desc: 'Quality education at prices that work for everyone. Transparent fee structure with no hidden charges whatsoever.',
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: 'Flexible Timings',
                desc: 'Morning, afternoon, and evening batches available. Choose what fits your schedule and study at your own pace.',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Small Batch Sizes',
                desc: 'Limited students per batch ensures personal attention, better interaction, and faster doubt resolution for everyone.',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-100 text-orange-700 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-600 to-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to Start Your Journey?</h2>
          <p className="mt-3 text-orange-100 text-lg max-w-xl mx-auto">
            Join hundreds of successful students who have achieved their goals with Lamka Coaching Center.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-white text-orange-700 hover:bg-orange-50 font-semibold shadow-lg h-12 px-8">
                Register Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/10 h-12 px-8 font-semibold">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
