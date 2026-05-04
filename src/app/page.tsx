'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  ChevronLeft,
  Zap,
  Shield,
  Laptop,
  Quote,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import ScrollReveal from '@/components/public/scroll-reveal';
import ContactSection from '@/components/public/contact-section';
import AchievementsSection from '@/components/public/achievements-section';
import UpcomingBatchesSection from '@/components/public/upcoming-batches-section';
import SuccessStoriesSection from '@/components/public/success-stories-section';
import PartnersSection from '@/components/public/partners-section';
import AnimatedCounter from '@/components/public/animated-counter';
import StudentJourneySection from '@/components/public/student-journey-section';
import StudyTipsSection from '@/components/public/study-tips-section';
import WaveDivider from '@/components/public/wave-divider';
import CourseDetailModal from '@/components/public/course-detail-modal';
import MotivationalQuotesSection from '@/components/public/motivational-quotes-section';

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

/* ─────────────────────────────────────────────
   Testimonials Data
   ───────────────────────────────────────────── */
const testimonials = [
  {
    name: 'Priya Sharma',
    course: 'SSC CGL Coaching',
    badge: 'SSC CGL 2024',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    text: 'I cleared SSC CGL in my very first attempt thanks to the structured guidance at Lamka Coaching Center. The mock tests and personal attention made all the difference!',
    rating: 5,
    avatar: 'PS',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Rahul Verma',
    course: 'CCC Computer Course',
    badge: 'NIELIT CCC',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    text: 'The CCC course here is excellent. The hands-on practice and patient instructors helped me score 85% in the NIELIT exam. Highly recommended for anyone starting their computer journey.',
    rating: 5,
    avatar: 'RV',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    name: 'Anjali Kumari',
    course: 'IBPS PO Coaching',
    badge: 'IBPS PO 2024',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    text: 'I was struggling with quantitative aptitude until I joined Lamka. The faculty broke down complex problems into simple steps. I finally cleared IBPS PO with confidence!',
    rating: 4,
    avatar: 'AK',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Mohit Singh',
    course: 'Tally Prime with GST',
    badge: 'Tally Certified',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    text: 'Best Tally course in Lamka! The practical accounting exercises and real GST return filing practice gave me the skills to land an accountant job within 2 months of finishing.',
    rating: 5,
    avatar: 'MS',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    name: 'Sneha Patel',
    course: 'Web Design & Development',
    badge: 'Web Dev Pro',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    text: 'From zero coding knowledge to building my own website — the web design course here is incredibly practical. The project-based learning approach is exactly what I needed.',
    rating: 5,
    avatar: 'SP',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    name: 'Arun Thakur',
    course: 'Study Cabin (Monthly)',
    badge: 'UPSC Prep',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    text: 'The study cabin facility is a game-changer. Quiet, comfortable, and available at flexible hours. It helped me maintain a consistent study routine during my UPSC preparation.',
    rating: 4,
    avatar: 'AT',
    gradient: 'from-rose-500 to-red-500',
  },
];

/* ─────────────────────────────────────────────
   Testimonials Carousel Section (Enhanced)
   ───────────────────────────────────────────── */
function TestimonialsSection({ dynamicTestimonials: dynamicData }: { dynamicTestimonials?: typeof testimonials }) {
  const [current, setCurrent] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTestimonials = dynamicData && dynamicData.length > 0 ? dynamicData : testimonials;
  const total = activeTestimonials.length;

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 5000);
  }, [total]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoPlay]);

  // Parallax effect on background pattern
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        setParallaxOffset(progress * 40 - 20);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goTo = (index: number) => {
    setCurrent(index);
    startAutoPlay();
  };

  const prev = () => {
    goTo((current - 1 + total) % total);
  };

  const next = () => {
    goTo((current + 1) % total);
  };

  const t = activeTestimonials[current];

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 bg-gray-950 relative overflow-hidden">
      {/* Background accents with parallax */}
      <div
        className="absolute inset-0 transition-transform duration-100"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(6,182,212,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.05) 0%, transparent 40%)',
          transform: `translateY(${parallaxOffset}px)`,
        }}
      />
      <div
        className="absolute inset-0 dot-grid-bg pointer-events-none transition-transform duration-100"
        style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            <Sparkles className="h-3 w-3 mr-1" /> Student Stories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">What Our Students Say</h2>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto text-lg">
            Real experiences from students who transformed their careers with us.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-3xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-6 z-10 h-11 w-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-cyan-400 hover:bg-white/20 hover:border-cyan-500/40 transition-all shadow-lg"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-6 z-10 h-11 w-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-cyan-400 hover:bg-white/20 hover:border-cyan-500/40 transition-all shadow-lg"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Testimonial Card with gradient border */}
          <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-cyan-500/60 via-cyan-400/20 to-sky-500/60">
            {/* Inner card with glassmorphism */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 overflow-hidden"
              >
                {/* Decorative large quote watermark */}
                <div className="absolute top-4 right-6 pointer-events-none select-none">
                  <Quote className="h-32 w-32 text-white/[0.04]" />
                </div>
                {/* Secondary smaller watermark */}
                <div className="absolute bottom-8 left-6 pointer-events-none select-none">
                  <Quote className="h-16 w-16 text-white/[0.03] rotate-180" />
                </div>

                {/* Quote icon */}
                <div className="mb-5">
                  <Quote className="h-10 w-10 text-cyan-500/40" />
                </div>

                {/* Text */}
                <p className="text-gray-200 text-lg leading-relaxed mb-6 relative z-10">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Rating stars */}
                <div className="flex items-center gap-1.5 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-400 font-medium">{t.rating}.0</span>
                </div>

                {/* Course badge */}
                <div className="mb-5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${t.badgeColor}`}>
                    <Award className="h-3 w-3 mr-1.5" />
                    {t.badge}
                  </span>
                </div>

                {/* Name & Course */}
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-base shadow-lg ring-2 ring-white/10`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">{t.name}</p>
                    <p className="text-sm text-cyan-400">{t.course}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Dots (larger) */}
        <div className="flex items-center justify-center gap-3 mt-10">
          {activeTestimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-3 rounded-full transition-all duration-300 ${i === current ? 'w-10 bg-cyan-400 shadow-lg shadow-cyan-400/30' : 'w-3 bg-white/20 hover:bg-white/40'}`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        {/* Thumbnail avatar navigation */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {activeTestimonials.map((item, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative transition-all duration-300 ${
                i === current
                  ? 'scale-110'
                  : 'scale-90 opacity-50 hover:opacity-80'
              }`}
              aria-label={`View ${item.name}'s testimonial`}
            >
              <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md transition-all duration-300 ${
                i === current ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-950 shadow-lg shadow-cyan-500/20' : ''
              }`}>
                {item.avatar}
              </div>
              {/* Active indicator dot below thumbnail */}
              {i === current && (
                <motion.div
                  layoutId="testimonial-thumb-indicator"
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-cyan-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FAQ Fallback Data
   ───────────────────────────────────────────── */
const faqFallback = [
  {
    question: 'What courses does Lamka Coaching Center offer?',
    answer: 'We offer a wide range of courses including Competitive Exam Coaching (SSC CGL, IBPS, SBI PO, UPSC, Railway), Computer Training (CCC, Tally Prime with GST, Advanced Excel, Web Design, Python, Hindi & English Typing), and dedicated Study Cabin facilities for focused preparation.',
  },
  {
    question: 'What is the fee structure for your courses?',
    answer: 'Our fee structure is very affordable and transparent. Computer courses start from ₹2,500 for Typing and go up to ₹15,000 for Web Design. Competitive exam coaching fees vary by program. We also offer installment payment options for eligible courses. Contact us for detailed fee information.',
  },
  {
    question: 'How can I book a study cabin?',
    answer: 'You can book a study cabin directly through our website by visiting the Cabins page. Cabins are available on both hourly and monthly basis. Simply select your preferred cabin, choose the time slot, and complete the booking. You can also visit our center for walk-in bookings.',
  },
  {
    question: 'What are the class timings and batch schedules?',
    answer: 'We offer flexible batch timings including morning (7 AM – 10 AM), afternoon (12 PM – 3 PM), and evening (4 PM – 7 PM) batches. Weekend batches are also available for working professionals. Each batch has limited seats to ensure quality interaction with instructors.',
  },
  {
    question: 'Do you provide certifications after course completion?',
    answer: 'Yes! Our computer courses come with NIELIT certification (for CCC) and Lamka Coaching Center certification for other programs. Competitive exam coaching students receive course completion certificates. All our certifications are recognized and add value to your professional profile.',
  },
  {
    question: 'Is there any demo or trial class available?',
    answer: 'Absolutely! We offer free demo classes for all our courses so you can experience our teaching methodology before enrolling. Simply contact us or visit our center to schedule a demo class at your convenience.',
  },
  {
    question: 'What is the admission process?',
    answer: 'The admission process is simple — you can register online through our website or visit our center in person. Fill out the registration form, choose your course, submit the required documents (ID proof and passport-size photo), and pay the fee. You can start attending classes immediately after enrollment.',
  },
  {
    question: 'Do you offer study materials and mock tests?',
    answer: 'Yes, we provide comprehensive study materials for all courses. Competitive exam students get access to regular mock tests, previous year question papers, and detailed performance analysis. Computer training students receive practical exercise books and project guides as part of their course.',
  },
];

/* ─────────────────────────────────────────────
   FAQ Accordion Section
   ───────────────────────────────────────────── */
function FAQSection() {
  const [faqs, setFaqs] = useState(faqFallback);
  const [faqLoading, setFaqLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/faqs')
      .then((r) => r.json())
      .then((data) => {
        if (data.faqs && data.faqs.length > 0) {
          setFaqs(data.faqs);
        }
      })
      .catch(() => {
        // Keep fallback data on error
      })
      .finally(() => setFaqLoading(false));
  }, []);

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge variant="secondary" className="mb-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
            Common Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            Got questions? We&apos;ve got answers. Find everything you need to know about our courses, fees, and facilities.
          </p>
        </div>

        {/* Accordion */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          {faqLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2 py-4">
                  <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-50 dark:bg-gray-800 rounded w-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.id || i} value={`faq-${i}`} className="border-gray-100">
                  <AccordionTrigger className="text-left text-base font-semibold text-gray-900 hover:text-cyan-700 hover:no-underline py-5 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 leading-relaxed text-base pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TypewriterText — Rotating typewriter effect
   ───────────────────────────────────────────── */
const typewriterPhrases = [
  'Competitive exam coaching for SSC, Banking & UPSC',
  'Professional computer training from CCC to Web Design',
  'Focused study spaces with flexible timings',
  'Everything you need to succeed, all in one place',
];

function TypewriterText() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = typewriterPhrases[phraseIndex];
    const speed = isDeleting ? 30 : 50;

    // Pause at end of phrase before deleting
    if (!isDeleting && charIndex === currentPhrase.length) {
      const pauseTimer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(pauseTimer);
    }

    // Move to next phrase after deletion completes
    if (isDeleting && charIndex === 0) {
      const switchTimer = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % typewriterPhrases.length);
      }, 30);
      return () => clearTimeout(switchTimer);
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => isDeleting ? prev - 1 : prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  const displayText = typewriterPhrases[phraseIndex].slice(0, charIndex);

  return (
    <span>
      {displayText}
      <span className="inline-block w-[3px] h-[1.1em] bg-cyan-300 ml-1 align-middle animate-[blink_1s_step-end_infinite]" />
    </span>
  );
}

/* ─────────────────────────────────────────────
   TiltCard — 3D tilt hover effect
   ───────────────────────────────────────────── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [shinePosition, setShinePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    setShinePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setTransform('');
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        transform,
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {children}
      {/* Gradient shine overlay that follows cursor */}
      {isHovering && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl opacity-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${shinePosition.x}% ${shinePosition.y}%, rgba(255,255,255,0.4), transparent 60%)`,
          }}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [cabinCount, setCabinCount] = useState<number | null>(null);
  const [dynamicTestimonials, setDynamicTestimonials] = useState<typeof testimonials>([]);

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

  // Parallax scroll state for hero floating shapes
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/courses').then((r) => r.json()),
      fetch('/api/public/notices').then((r) => r.json()),
      fetch('/api/public/settings').then((r) => r.json()),
      fetch('/api/public/homepage').then((r) => r.json()),
    ])
      .then(([coursesData, noticesData, settingsData, homepageData]) => {
        setDepartments(coursesData.departments || []);
        setNotices((noticesData.notices || []).slice(0, 4));
        setSiteSettings(settingsData.settings || {});
        if (homepageData.cabinCount !== undefined && homepageData.cabinCount !== null) setCabinCount(homepageData.cabinCount);
        if (homepageData.testimonials && homepageData.testimonials.length > 0) {
          setDynamicTestimonials(homepageData.testimonials);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCourses = departments.reduce((sum, d) => sum + d.courses.length, 0);
  const computerDept = departments.find((d) => d.name === 'Computer Training');
  const otherDepts = departments.filter((d) => d.name !== 'Computer Training');

  // Open course detail modal
  const openCourseModal = (course: { id: string; name: string; duration: string | null; totalFee: number; description: string | null }, departmentName: string) => {
    setSelectedCourse({ ...course, departmentName });
    setCourseModalOpen(true);
  };

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
          {/* Hero dot grid — subtle depth pattern */}
          <div className="absolute inset-0 hero-dot-grid pointer-events-none" />
          {/* Gradient mesh overlay — rich, modern multi-point radial gradients */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(56,189,248,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 85% 75%, rgba(20,184,166,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 10%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 90% 10%, rgba(125,211,252,0.08) 0%, transparent 50%), radial-gradient(ellipse 60% 60% at 5% 85%, rgba(6,182,212,0.09) 0%, transparent 55%)' }} />
          {/* Legacy radial gradients for additional depth */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%), radial-gradient(circle at 60% 80%, rgba(255,255,255,0.03) 0%, transparent 40%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

          {/* Floating shapes with parallax */}
          <div className="absolute top-[10%] left-[5%] w-32 h-32 rounded-full bg-cyan-300/10" style={{ animation: 'float-1 20s ease-in-out infinite', transform: `translateY(${Math.min(scrollY * 0.5, 30)}px)` }} />
          <div className="absolute top-[60%] left-[15%] w-48 h-48 rounded-2xl bg-sky-300/[0.07] rotate-12" style={{ animation: 'float-2 25s ease-in-out infinite', transform: `translateY(${Math.min(scrollY * 0.35, 30)}px) rotate(12deg)` }} />
          <div className="absolute top-[20%] right-[10%] w-24 h-24 rounded-full bg-teal-300/[0.08]" style={{ animation: 'float-3 18s ease-in-out infinite', transform: `translateY(${Math.min(scrollY * 0.45, 30)}px)` }} />
          <div className="absolute bottom-[25%] right-[20%] w-40 h-40 rounded-2xl bg-cyan-400/[0.06] -rotate-6" style={{ animation: 'float-4 22s ease-in-out infinite', transform: `translateY(${Math.min(scrollY * 0.3, 30)}px) rotate(-6deg)` }} />
          <div className="absolute top-[45%] left-[45%] w-20 h-20 rounded-full bg-sky-200/[0.09]" style={{ animation: 'float-5 15s ease-in-out infinite', animationDelay: '3s', transform: `translateY(${Math.min(scrollY * 0.55, 30)}px)` }} />
          <div className="absolute bottom-[15%] left-[60%] w-36 h-36 rounded-2xl bg-teal-400/[0.07] rotate-45" style={{ animation: 'float-6 28s ease-in-out infinite', animationDelay: '5s', transform: `translateY(${Math.min(scrollY * 0.4, 30)}px) rotate(45deg)` }} />

          {/* Floating particles — soft blurred dots rising upward */}
          {[
            { size: 6,  x: '12%', startY: 85, color: 'rgb(103,232,249)', opacity: 0.5, blur: 4,  duration: 14, delay: 0 },
            { size: 4,  x: '28%', startY: 70, color: 'rgb(56,189,248)',  opacity: 0.4, blur: 3,  duration: 18, delay: 2 },
            { size: 8,  x: '72%', startY: 90, color: 'rgb(94,234,212)',  opacity: 0.35, blur: 5, duration: 16, delay: 4 },
            { size: 5,  x: '88%', startY: 75, color: 'rgb(125,211,252)', opacity: 0.45, blur: 3,  duration: 20, delay: 1 },
            { size: 3,  x: '45%', startY: 80, color: 'rgb(34,211,238)',  opacity: 0.5, blur: 2,  duration: 12, delay: 5 },
            { size: 7,  x: '60%', startY: 95, color: 'rgb(153,246,228)', opacity: 0.3, blur: 6,  duration: 22, delay: 3 },
            { size: 4,  x: '35%', startY: 60, color: 'rgb(56,189,248)',  opacity: 0.4, blur: 3,  duration: 17, delay: 6 },
            { size: 5,  x: '80%', startY: 88, color: 'rgb(103,232,249)', opacity: 0.35, blur: 4, duration: 15, delay: 7 },
          ].map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                left: p.x,
                bottom: `${p.startY}%`,
                backgroundColor: p.color,
                opacity: p.opacity,
                filter: `blur(${p.blur}px)`,
              }}
              animate={{
                y: [0, -120, -240, -360],
                opacity: [p.opacity, p.opacity * 0.8, p.opacity * 0.5, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text with staggered entrance animation */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  <span className="text-sm font-medium text-sky-100">{heroBadgeText}</span>
                </div>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
              >
                Build Your
                <br />
                <span className="bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 bg-clip-text text-transparent animate-gradient-text">Future</span> With Us
              </motion.h1>

              <motion.div
                className="mt-5 text-lg sm:text-xl text-cyan-100/80 leading-relaxed max-w-lg h-[4.5rem] sm:h-[3.5rem]"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
              >
                <TypewriterText />
              </motion.div>

              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
              >
                <Link href="/register">
                  <Button size="lg" className="h-13 px-7 bg-white text-gray-900 hover:bg-cyan-50 font-bold text-base shadow-xl shadow-black/20 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 cta-shimmer">
                    Enroll Free
                    <ArrowRight className="h-4.5 w-4.5 ml-2" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="h-13 px-7 bg-transparent border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
                    View Courses
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right: Floating stat cards with entrance animation */}
            <div className="hidden lg:block">
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              >
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl gradient-border">
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
                      { label: 'Total Courses', end: totalCourses, icon: <GraduationCap className="h-4 w-4" /> },
                      { label: 'Departments', end: departments.length, icon: <Target className="h-4 w-4" /> },
                      { label: 'Study Cabins', end: cabinCount ?? 0, icon: <DoorOpen className="h-4 w-4" /> },
                      { label: 'IT Programs', end: computerDept?.courses.length ?? 0, icon: <Laptop className="h-4 w-4" /> },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 text-cyan-200 mb-1">
                          {stat.icon}
                          <span className="text-xs">{stat.label}</span>
                        </div>
                        <AnimatedCounter end={stat.end} duration={1500} className="text-2xl font-bold text-white" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating accent card */}
                <div className="absolute -bottom-4 -left-4 bg-sky-500 text-gray-900 rounded-xl px-5 py-3 shadow-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-bold">{heroBannerText}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom wave — dark to light transition */}
      </section>

      {/* Wave: Hero (dark) → Trust Bar (light) */}
      <WaveDivider type="wave" fillLight="#ffffff" fillDark="#111827" />

      {/* ============================================
          TRUST BAR — Quick trust signals
          ============================================ */}
      <ScrollReveal>
      <section className="py-8 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm text-gray-500">
            {[
              { icon: <Shield className="h-4 w-4 text-green-600" />, text: 'Govt. Recognized Courses' },
              { icon: <Users className="h-4 w-4 text-cyan-600" />, text: '500+ Students Trained' },
              { icon: <Award className="h-4 w-4 text-blue-600" />, text: 'Experienced Faculty' },
              { icon: <CheckCircle2 className="h-4 w-4 text-purple-600" />, text: 'Affordable Fee Structure' },
            ].map((item, index, arr) => (
              <div key={item.text} className="flex items-center gap-2 hover-icon-bounce cursor-default">
                <span className="trust-icon">{item.icon}</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">{item.text}</span>
                {index < arr.length - 1 && (
                  <span className="hidden sm:inline-block ml-6 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ============================================
          WHAT WE OFFER — 3-pillar layout
          ============================================ */}
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">Our Programs</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Three Paths. One Destination.
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
              Whether you&apos;re preparing for government exams, learning computer skills, or need a quiet place to study — we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Competitive Exams */}
            <TiltCard className="group relative bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-800 dark:to-gray-800 border border-blue-100 dark:border-gray-700 rounded-2xl p-7 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 overflow-hidden">
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-cyan-400" />
              <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Competitive Exam Coaching</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
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
            </TiltCard>

            {/* Card 2: Computer Training */}
            <TiltCard className="group relative bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-gray-800 dark:to-gray-800 border border-cyan-100 dark:border-gray-700 rounded-2xl p-7 hover:shadow-xl hover:shadow-cyan-100/50 transition-all duration-300 overflow-hidden">
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-teal-400" />
              <div className="absolute top-4 right-4">
                <Badge className="bg-cyan-600 text-white text-[10px] animate-subtle-pulse">Popular</Badge>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-cyan-200">
                <Monitor className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Computer Training Center</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                From basic computer literacy to professional IT skills — CCC, Tally Prime with GST, Advanced Excel, Web Development, Python, and bilingual typing courses.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['CCC', 'Tally', 'Excel', 'Web Design', 'Python', 'Typing'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-md text-xs font-medium">{tag}</span>
                ))}
              </div>
              <Link href="/computer-training" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 group-hover:gap-2 transition-all">
                Explore Programs <ChevronRight className="h-4 w-4" />
              </Link>
            </TiltCard>

            {/* Card 3: Study Cabins */}
            <TiltCard className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 border border-green-100 dark:border-gray-700 rounded-2xl p-7 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300 overflow-hidden">
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-400 to-emerald-400" />
              <div className="h-14 w-14 rounded-2xl bg-green-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-green-200">
                <DoorOpen className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Study Cabin Spaces</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
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
            </TiltCard>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

      {/* ============================================
          STUDENT JOURNEY — Progress tracker
          ============================================ */}
      <ScrollReveal>
        <StudentJourneySection />
      </ScrollReveal>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

      {/* ============================================
          ACHIEVEMENTS — Results & Impact
          ============================================ */}
      <ScrollReveal>
        <AchievementsSection />
      </ScrollReveal>

      {/* ============================================
          SUCCESS STORIES — Student achievements
          ============================================ */}
      <ScrollReveal>
        <SuccessStoriesSection />
      </ScrollReveal>

      {/* Wave: Achievements + Success Stories (dark) → AI Study Tips (light) */}
      <WaveDivider type="wave" fillLight="#ffffff" fillDark="#111827" />

      {/* ============================================
          AI STUDY TIPS — Personalized learning advice
          ============================================ */}
      <ScrollReveal>
        <StudyTipsSection />
      </ScrollReveal>

      {/* Wave: AI Study Tips (light) → Computer Training (dark) */}
      <WaveDivider type="wave" fillLight="#030712" fillDark="#030712" flip />

      {/* ============================================
          COMPUTER TRAINING — Dedicated feature section
          ============================================ */}
      {!loading && computerDept && (
        <section className="py-20 sm:py-28 bg-gray-950 relative overflow-hidden">
          {/* Background accents */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(6,182,212,0.05) 0%, transparent 40%)' }} />
          <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

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
                <div key={course.id} className="group bg-white/5 border border-white/10 border-l-4 border-l-cyan-500 rounded-2xl p-5 hover:bg-cyan-50/5 dark:hover:bg-cyan-950/30 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer" onClick={() => openCourseModal(course, computerDept.name)}>
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
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/register?courseId=${course.id}`}>
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg">
                        Enroll Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                    <button
                      onClick={() => openCourseModal(course, computerDept.name)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Wave: Computer Training (dark) → Competitive Exams (light) */}
      <WaveDivider type="curve" fillLight="#ffffff" fillDark="#111827" />

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
                  <Card key={course.id} className="border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group overflow-hidden cursor-pointer" onClick={() => openCourseModal(course, dept.name)}>
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
                      <div onClick={(e) => e.stopPropagation()}>
                        <Link href={`/register?courseId=${course.id}`}>
                          <Button size="sm" variant="ghost" className="mt-3 text-blue-700 hover:text-blue-800 hover:bg-blue-50 p-0 h-auto font-semibold">
                            Enroll Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
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
        <section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-cyan-100 text-cyan-600 animate-pulse mb-3">
                <GraduationCap className="h-6 w-6" />
              </div>
              <p className="text-sm text-gray-400">Loading courses...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          NOTICES — Clean announcement ticker
          ============================================ */}
      {!loading && notices.length > 0 && (
        <section className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <Badge variant="secondary" className="mb-3 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">Announcements</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Latest Notices</h2>
              </div>
              <Link href="/notices">
                <Button variant="outline" size="sm" className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-xl hidden sm:flex">
                  All Notices <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((notice) => (
                <Card key={notice.id} className={`rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow ${notice.pinned ? 'ring-2 ring-cyan-200 dark:ring-cyan-800 bg-cyan-50/30 dark:bg-cyan-950/30 border-l-4 border-l-cyan-500' : 'bg-white dark:bg-gray-800 border-l-4 border-l-gray-300 dark:border-l-gray-600'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {notice.pinned && (
                        <Badge className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-[10px] px-1.5 rounded-md">
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
          UPCOMING BATCHES — Schedule section
          ============================================ */}
      <ScrollReveal>
        <UpcomingBatchesSection />
      </ScrollReveal>

      {/* ============================================
          MOTIVATIONAL QUOTES — Daily inspiration
          ============================================ */}
      <ScrollReveal>
        <MotivationalQuotesSection />
      </ScrollReveal>

      {/* ============================================
          WHY CHOOSE US — Bento grid
          ============================================ */}
      <ScrollReveal>
      <section className="py-20 sm:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Why Lamka?</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Why Students Choose Us</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
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
              <div key={feature.title} className="group/card p-[1px] rounded-2xl bg-transparent hover:bg-gradient-to-br hover:from-cyan-200 hover:to-sky-200 dark:hover:from-cyan-800 dark:hover:to-sky-800 transition-all duration-300">
                <div className={`${feature.bg} dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:shadow-md group-hover/card:-translate-y-0.5 transition-all duration-300 h-full`}>
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${feature.accent} text-white mb-4 shadow-sm`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Wave: Why Choose Us (light) → Testimonials (dark) */}
      <WaveDivider type="wave" fillLight="#030712" fillDark="#030712" flip />

      {/* ============================================
          TESTIMONIALS — Student stories carousel
          ============================================ */}
      <ScrollReveal>
      <TestimonialsSection dynamicTestimonials={dynamicTestimonials} />
      </ScrollReveal>

      {/* ============================================
          CONTACT — Get in touch form
          ============================================ */}
      <ScrollReveal>
      <ContactSection />
      </ScrollReveal>

      {/* ============================================
          FAQ — Frequently Asked Questions
          ============================================ */}
      <ScrollReveal>
      <FAQSection />
      </ScrollReveal>

      {/* Wave: FAQ (light) → CTA (dark) */}
      <WaveDivider type="wave" fillLight="#030712" fillDark="#030712" flip />

      {/* ============================================
          CTA — Strong final push
          ============================================ */}
      <section className="py-20 sm:py-28 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-border-glow rounded-3xl cta-glow-shadow bg-gray-950 p-10 sm:p-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Your Success Story
            <br />
            <span className="bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 bg-clip-text text-transparent animate-gradient-text">Starts Here</span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
            Join hundreds of students who turned their aspirations into achievements with Lamka Coaching Center. Take the first step today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="h-13 px-8 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold text-base shadow-xl shadow-cyan-900/30 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
                Register for Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="h-13 px-8 bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/30 font-semibold text-base rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
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
        </div>
      </section>

      {/* Wave: CTA (dark) → Partners (light) */}
      <WaveDivider type="curve" fillLight="#ffffff" fillDark="#111827" />

      {/* ============================================
          PARTNERS — Placement partners / recruiters
          ============================================ */}
      <ScrollReveal>
        <PartnersSection />
      </ScrollReveal>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          open={courseModalOpen}
          onOpenChange={setCourseModalOpen}
        />
      )}
    </PublicLayout>
  );
}
