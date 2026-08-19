'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import {
  GraduationCap,
  DoorOpen,
  Users,
  Clock,
  ArrowRight,
  Monitor,
  BookOpen,
  Calendar,
  Quote,
  User,
  Sparkles,
} from 'lucide-react';
import CourseDetailModal from '@/components/public/course-detail-modal';

/* ─────────────────────────────────────────────
   Types & Interfaces
   ───────────────────────────────────────────── */

interface CourseItem {
  id: string;
  name: string;
  duration: string | null;
  totalFee: number;
  description: string | null;
}

interface Department {
  id: string;
  name: string;
  courses: CourseItem[];
}

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

interface SiteSettings {
  heroBadgeText?: string;
  heroBannerText?: string;
  footerCtaTitle?: string;
  footerCtaSubtitle?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  inspirationalQuote?: string;
  inspirationalQuoteAuthor?: string;
}

interface SuccessStory {
  id: string;
  name: string;
  achievement: string;
  batch: string;
}

/* ─────────────────────────────────────────────
   Success Stories Data (Ready for upcoming API)
   ───────────────────────────────────────────── */
const successStoriesList: SuccessStory[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    achievement: 'SSC CGL 2023 - Income Tax Inspector',
    batch: 'Batch of 2023',
  },
  {
    id: '2',
    name: 'Priya Patel',
    achievement: 'IBPS PO 2023 - SBI',
    batch: 'Batch of 2023',
  },
  {
    id: '3',
    name: 'Amit Kumar',
    achievement: 'UPSC EPFO 2023',
    batch: 'Batch of 2023',
  },
  {
    id: '4',
    name: 'Neha Singh',
    achievement: 'RRB NTPC 2022 - Station Master',
    batch: 'Batch of 2022',
  },
];

/* ─────────────────────────────────────────────
   Helper Utilities
   ───────────────────────────────────────────── */
function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  // Tabs state
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>('all');
  const [selectedBatchTab, setSelectedBatchTab] = useState<string>('all');

  // Course detail modal state
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    name: string;
    duration: string | null;
    totalFee: number;
    description: string | null;
    departmentName: string;
  } | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/courses').then((r) => r.json()),
      fetch('/api/public/batches').then((r) => r.json()),
      fetch('/api/public/settings').then((r) => r.json()),
    ])
      .then(([coursesData, batchesData, settingsData]) => {
        setDepartments(coursesData.departments || []);
        setBatches(Array.isArray(batchesData) ? batchesData : batchesData.batches || []);
        setSiteSettings(settingsData.settings || {});
      })
      .catch((err) => {
        console.error('Error loading homepage data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered courses
  const allCourses = useMemo(() => {
    const list: { course: CourseItem; departmentName: string }[] = [];
    departments.forEach((dept) => {
      dept.courses.forEach((c) => {
        list.push({ course: c, departmentName: dept.name });
      });
    });
    return list;
  }, [departments]);

  const filteredCourses = useMemo(() => {
    if (selectedCourseTab === 'all') return allCourses;
    return allCourses.filter((item) => item.departmentName.toLowerCase().includes(selectedCourseTab.toLowerCase()));
  }, [allCourses, selectedCourseTab]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    if (selectedBatchTab === 'all') return batches;
    return batches.filter((b) =>
      b.department.toLowerCase().includes(selectedBatchTab.toLowerCase()) ||
      b.courseName.toLowerCase().includes(selectedBatchTab.toLowerCase())
    );
  }, [batches, selectedBatchTab]);

  const openCourseModal = (course: CourseItem, departmentName: string) => {
    setSelectedCourse({ ...course, departmentName });
    setCourseModalOpen(true);
  };

  // Open modal from batch
  const openBatchModal = (batch: BatchData) => {
    setSelectedCourse({
      id: batch.id,
      name: batch.courseName,
      duration: batch.duration,
      totalFee: batch.fee,
      description: batch.description || `Batch timing: ${batch.timing}. Seats remaining: ${batch.seats}. Starts on ${formatDate(batch.startDate)}.`,
      departmentName: batch.department,
    });
    setCourseModalOpen(true);
  };

  // Dynamic values
  const heroBadge = siteSettings.heroBadgeText || 'Admissions Open 2025-26';
  const quoteText = siteSettings.inspirationalQuote || "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing or learning to do.";
  const quoteAuthor = siteSettings.inspirationalQuoteAuthor || 'Pelé';

  return (
    <PublicLayout>
      {/* ========================================================
          1. HERO SECTION (Responsive 2-Column Stitch Layout)
          ======================================================== */}
      <section className="w-full px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1280px] mx-auto py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="flex flex-col gap-4 sm:gap-5">
            <div>
              <span className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-cyan-500" />
                {heroBadge}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.15] sm:leading-[1.1] tracking-tight">
              Build Your <br />
              <span className="bg-gradient-to-r from-cyan-600 to-sky-500 dark:from-cyan-400 dark:to-sky-400 bg-clip-text text-transparent">
                Future With Us
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
              Expert preparation for competitive exams, professional IT skills, and dedicated study spaces designed for your success.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-3">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 active:scale-95 text-white text-sm sm:text-base font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center cursor-pointer"
              >
                Enroll Free
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-sm sm:text-base font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-all duration-200 inline-flex items-center justify-center cursor-pointer"
              >
                View Courses
              </Link>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="relative h-[240px] sm:h-[340px] md:h-[400px] lg:h-[480px] w-full rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl bg-gray-900 border-2 sm:border-4 border-white dark:border-gray-800 group">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTWsiFMBcYscT6HKyE_tMViTyb3WozM5XHV6PxaMpnQp9DmKM49GARyQabfCGtDJJlKIm_oUvoZBBFp7XZlm1OMAg0o_-UB3CByi5DNaYzxzqLzVlqyBnQZkBSac32Bx5UPJezCPX2_8FxYaEkXbVR4LhnerdBf8xCJ9VThO7dWN9sGLORaw8OnSNqsPIU6wMKDJzsIC5ZqHxcWYpcppNex-DbRmdoAMwkRytftXhqRGhq83ZkN9RD"
              alt="Modern classroom with students learning at Lamka Coaching Center"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          2. THREE PATHS (Responsive Midnight Cyan Bento Grid)
          ======================================================== */}
      <section className="relative py-14 sm:py-16 md:py-20 text-white overflow-hidden">
        {/* Animated background gradient - Deep Midnight Cyan */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#061826] via-[#092235] to-[#030e17]" />
        
        {/* Gradient mesh overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(6,182,212,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 85% 75%, rgba(14,165,233,0.14) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 10%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 90% 10%, rgba(125,211,252,0.10) 0%, transparent 50%), radial-gradient(ellipse 60% 60% at 5% 85%, rgba(6,182,212,0.12) 0%, transparent 55%)',
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 w-full px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1280px] mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight drop-shadow-xs">
              Three Paths. One Destination.
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-cyan-100 max-w-2xl mx-auto leading-relaxed px-2">
              Whether you&apos;re preparing for government exams, learning computer skills, or need a quiet place to study — we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
            {/* Dept 1 - Competitive Exam Coaching */}
            <div className="group relative rounded-2xl overflow-hidden flex flex-col h-[340px] sm:h-[380px] md:h-[400px] shadow-2xl border border-white/20 hover:shadow-cyan-950/50 hover:border-white/40 hover:-translate-y-1.5 transition-all duration-300">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzuAVGTp2Gk-fqrvca4twOmhSoHPmQdf0XMgbUyvJMyu9vo0Y9cZKqZhsD577PkJPnTCsqVD30sZSdk7pTCLizk2Sa2EzCl4nempQlYr2_tKnMdOTPGwyvVV5wBj-6jnuuXrakV-RmXxBJ64wXUMfI06X7EFxypY8ZzcoaGI47A6f8gMtMZoSv-8wFwR0I1Ibv6yDDwgFQtv97VnG5LJy4DSsXyAwBAEgEvF7aER-dRSZYSZdaVCth"
                alt="Students studying in classroom"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/75 to-transparent" />
              <div className="relative z-10 p-5 sm:p-7 flex flex-col h-full justify-end">
                <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg shadow-cyan-950/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 border border-white/20">
                  <GraduationCap className="h-6 sm:h-7 w-6 sm:w-7 text-white stroke-[2]" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 leading-snug">
                  Competitive Exam Coaching
                </h3>
                <p className="text-xs sm:text-sm text-cyan-100/90 mb-4 sm:mb-5 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  Expert preparation for SSC, Banking, UPSC, and Railway exams with structured curriculum.
                </p>
                <Link
                  href="/courses"
                  className="text-cyan-300 hover:text-white text-xs font-bold uppercase flex items-center gap-1.5 transition-colors tracking-wider group-hover:translate-x-1"
                >
                  Explore Courses <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Dept 2 - Computer Training Center */}
            <div className="group relative rounded-2xl overflow-hidden flex flex-col h-[340px] sm:h-[380px] md:h-[400px] shadow-2xl border border-white/20 hover:shadow-cyan-950/50 hover:border-white/40 hover:-translate-y-1.5 transition-all duration-300">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpHEJqHv-8sioQCjC1lBYRQwWWa3YaBd66mTpinF9XLBm2PT8zTmL_CrJpTrHypMgn7xU8Ki6ZDeLl2TBwVldN1SrCe_J9bLNP8ZupavtuNTUSkmMQaco2VEFL81T2FOpgCdefeihgTHhPuwdjFA3o-3UJ-Z_33t-kiA9qy1REAFmvkfEon6GprIx0apmoGund-mKYIMAm-aCP1ZNsqreiDdRCsxjpO6DjgTpjsTkW-TbEB2DP1hPh"
                alt="Person working on computer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/75 to-transparent" />
              <div className="relative z-10 p-5 sm:p-7 flex flex-col h-full justify-end">
                <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg shadow-cyan-950/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 border border-white/20">
                  <Monitor className="h-6 sm:h-7 w-6 sm:w-7 text-white stroke-[2]" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 leading-snug">
                  Computer Training Center
                </h3>
                <p className="text-xs sm:text-sm text-cyan-100/90 mb-4 sm:mb-5 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  From basic computer literacy to professional IT skills — CCC, Tally Prime, Web Dev, Python.
                </p>
                <Link
                  href="/computer-training"
                  className="text-cyan-300 hover:text-white text-xs font-bold uppercase flex items-center gap-1.5 transition-colors tracking-wider group-hover:translate-x-1"
                >
                  Explore Programs <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Dept 3 - Study Cabin Spaces */}
            <div className="group relative rounded-2xl overflow-hidden flex flex-col h-[340px] sm:h-[380px] md:h-[400px] shadow-2xl border border-white/20 hover:shadow-cyan-950/50 hover:border-white/40 hover:-translate-y-1.5 transition-all duration-300">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBln9WIh91Ltsx0VKQjAPLbJLRRPx6tc0D4-3E5Op7HQx4ZFfLGEhw1Zyo0_kopGf5XVcRTwVM91SsR61oHnGedXdjc-yzp-YnJbBEAYGAXFP-OPGB9lHBctXg9frlwd97diHMdCJ1UxGF80jtnFFKrI423w5P1SIjP2CjZR3_MhinVzOumrLUFNN69DiwskMZYvfxkzTkHD-DAWN6UwLPrA4-jClZI1FL2w2neVog8e5UvIfwnlfYF"
                alt="Quiet individual study cabin"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/75 to-transparent" />
              <div className="relative z-10 p-5 sm:p-7 flex flex-col h-full justify-end">
                <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg shadow-cyan-950/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 border border-white/20">
                  <DoorOpen className="h-6 sm:h-7 w-6 sm:w-7 text-white stroke-[2]" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 leading-snug">
                  Study Cabin Spaces
                </h3>
                <p className="text-xs sm:text-sm text-cyan-100/90 mb-4 sm:mb-5 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  Dedicated quiet study spaces with comfortable seating, proper lighting, and flexible timings.
                </p>
                <Link
                  href="/cabins"
                  className="text-cyan-300 hover:text-white text-xs font-bold uppercase flex items-center gap-1.5 transition-colors tracking-wider group-hover:translate-x-1"
                >
                  Book a Cabin <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. FEATURED COURSES & UPCOMING BATCHES (Slate / Soft Background)
          ======================================================== */}
      <section className="bg-gray-50/70 dark:bg-gray-900/50 py-12 sm:py-16 md:py-20">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1280px] mx-auto">
          
          {/* Ongoing Courses Header */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              Ongoing Courses
            </h2>

            {/* Pill Filters (Smooth horizontal swipe on mobile) */}
            <div className="flex gap-2 sm:gap-2.5 mt-4 sm:mt-6 mb-4 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedCourseTab('all')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCourseTab === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCourseTab('competitive')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCourseTab === 'competitive'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                Competitive Exam
              </button>
              <button
                onClick={() => setSelectedCourseTab('banking')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCourseTab === 'banking'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                Banking
              </button>
              <button
                onClick={() => setSelectedCourseTab('computer')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCourseTab === 'computer'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                Computer Training
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Join our active sessions and start learning today.
              </p>
              <Link
                href="/courses"
                className="text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase flex items-center gap-1 hover:underline transition-all tracking-wider group"
              >
                View All Courses <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Ongoing Courses Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-14 sm:mb-20">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 animate-pulse space-y-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                </div>
              ))
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="text-gray-500 text-sm">No ongoing courses found for this category.</p>
              </div>
            ) : (
              filteredCourses.slice(0, 6).map(({ course, departmentName }) => (
                <div
                  key={course.id}
                  className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-cyan-500/30 hover:-translate-y-1.5 transition-all duration-300 relative flex flex-col justify-between"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      In Progress
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 flex flex-col justify-between flex-grow">
                    <div>
                      <span className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                        {departmentName}
                      </span>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-4 sm:mt-5 mb-2 sm:mb-3 leading-snug">
                        {course.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5 sm:mb-6 line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem]">
                        {course.description || 'Comprehensive curriculum with practice mock papers and faculty mentorship.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs font-medium">
                        <Calendar className="h-4 w-4 text-cyan-500" />
                        <span>Duration: {course.duration || 'Flexible'} • {course.totalFee > 0 ? formatCurrency(course.totalFee) : 'Contact Us'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-1 sm:mt-2">
                        <Link
                          href={`/register?courseId=${course.id}`}
                          className="w-full bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 active:scale-95 text-white py-2.5 sm:py-3 rounded-xl font-semibold shadow-md shadow-cyan-500/20 hover:shadow-lg transition-all duration-200 text-xs sm:text-sm text-center inline-flex items-center justify-center cursor-pointer"
                        >
                          Enrolling Now
                        </Link>
                        <button
                          onClick={() => openCourseModal(course, departmentName)}
                          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-center inline-flex items-center justify-center cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Upcoming Batches Header */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              Upcoming Batches
            </h2>

            {/* Pill Filters (Smooth horizontal swipe on mobile) */}
            <div className="flex gap-2 sm:gap-2.5 mt-4 sm:mt-6 mb-4 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedBatchTab('all')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedBatchTab === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedBatchTab('ssc')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedBatchTab === 'ssc'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                SSC
              </button>
              <button
                onClick={() => setSelectedBatchTab('banking')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedBatchTab === 'banking'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                Banking
              </button>
              <button
                onClick={() => setSelectedBatchTab('computer')}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedBatchTab === 'computer'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 hover:shadow-xs active:scale-95'
                }`}
              >
                Computer Training
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Secure your spot in our upcoming 2025 programs.
              </p>
              <Link
                href="/register"
                className="text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase flex items-center gap-1 hover:underline transition-all tracking-wider group"
              >
                View All Batches <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Upcoming Batches Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 animate-pulse space-y-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                </div>
              ))
            ) : filteredBatches.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="text-gray-500 text-sm">No upcoming batches scheduled for this selection.</p>
              </div>
            ) : (
              filteredBatches.slice(0, 6).map((batch) => (
                <div
                  key={batch.id}
                  className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-cyan-500/30 hover:-translate-y-1.5 transition-all duration-300 relative flex flex-col justify-between"
                >
                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-cyan-500 to-sky-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      New Batch
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 flex flex-col justify-between flex-grow">
                    <div>
                      <span className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                        {batch.department}
                      </span>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-4 sm:mt-5 mb-2 sm:mb-3 leading-snug">
                        {batch.courseName}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-5 sm:mb-6 line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem]">
                        {batch.description || `Timing: ${batch.timing}. Limited seats available.`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs font-medium">
                        <Calendar className="h-4 w-4 text-cyan-500" />
                        <span>Starting: {formatDate(batch.startDate)} • {batch.seats} seats left</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-1 sm:mt-2">
                        <Link
                          href="/register"
                          className="w-full bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 active:scale-95 text-white py-2.5 sm:py-3 rounded-xl font-semibold shadow-md shadow-cyan-500/20 hover:shadow-lg transition-all duration-200 text-xs sm:text-sm text-center inline-flex items-center justify-center cursor-pointer"
                        >
                          Quick Enroll
                        </Link>
                        <button
                          onClick={() => openBatchModal(batch)}
                          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-center inline-flex items-center justify-center cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. SUCCESS STORIES (Responsive Grid)
          ======================================================== */}
      <section className="bg-white dark:bg-gray-950 py-12 sm:py-16 md:py-20 border-t border-gray-200 dark:border-gray-800">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1280px] mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-3 tracking-tight">
              Our Success Stories
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              Celebrating the hard work and achievements of our dedicated students.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {successStoriesList.map((student) => (
              <div
                key={student.id}
                className="group bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-cyan-500/40 hover:-translate-y-1.5 transition-all duration-300 text-center flex flex-col justify-between cursor-default"
              >
                <div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-50 dark:bg-cyan-950/50 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center border-2 border-cyan-500 shadow-inner transition-transform duration-300 group-hover:scale-105">
                    <User className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-600 dark:text-cyan-400 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {student.name}
                  </h3>
                </div>

                <p className="text-cyan-600 dark:text-cyan-400 font-bold text-[11px] sm:text-xs uppercase mt-2.5 sm:mt-3 leading-relaxed tracking-wider">
                  {student.achievement}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          5. DAILY INSPIRATION QUOTE (Responsive Quote Block)
          ======================================================== */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 sm:py-16 md:py-24 border-t border-gray-200 dark:border-gray-800">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center justify-center">
            <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-500 dark:text-cyan-400 rotate-180" />
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 sm:mb-6 italic leading-relaxed tracking-tight px-2">
            &ldquo;{quoteText}&rdquo;
          </h2>

          <p className="text-base sm:text-lg lg:text-xl font-bold text-cyan-600 dark:text-cyan-400">
            — {quoteAuthor}
          </p>
        </div>
      </section>

      {/* Course Details Modal */}
      {selectedCourse && (
        <CourseDetailModal
          open={courseModalOpen}
          onOpenChange={(open) => setCourseModalOpen(open)}
          course={selectedCourse}
        />
      )}
    </PublicLayout>
  );
}
