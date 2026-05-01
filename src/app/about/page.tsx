'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Monitor,
  DoorOpen,
  Target,
  Heart,
  Eye,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Sparkles,
  Lightbulb,
  Handshake,
  Linkedin,
  Mail,
} from 'lucide-react';
import ScrollReveal from '@/components/public/scroll-reveal';
import GallerySection from '@/components/public/gallery-section';

// ─── Types ────────────────────────────────────────────
interface TeamMemberData {
  id: string;
  name: string;
  role: string;
  bio: string;
  initials: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

interface MilestoneData {
  id: string;
  year: string;
  event: string;
  sortOrder: number;
}

interface AboutSettingsData {
  about_story?: string;
  about_story_extra?: string;
  about_story_closing?: string;
  about_mission?: string;
  about_vision?: string;
}

interface SiteSettings {
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
}

// ─── Static content (not admin-managed) ───────────────
const coreValues = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: 'Student First',
    desc: 'Every decision we make starts with one question — what is best for our students? Their success defines our purpose and drives everything we do at the center.',
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: 'Excellence',
    desc: 'We believe in delivering nothing but the best. From our teaching methods to our study materials, we maintain the highest standards of quality in every aspect of our programs.',
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: 'Innovation',
    desc: 'We continuously evolve our teaching methods, embrace technology in the classroom, and develop creative approaches to make learning more effective and engaging for every student.',
  },
  {
    icon: <Handshake className="h-6 w-6" />,
    title: 'Integrity',
    desc: 'Transparency and honesty are at the core of our institution. We maintain fair practices, honest communication, and build trust with every student and parent who walks through our doors.',
  },
];

export default function AboutPage() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [aboutSettings, setAboutSettings] = useState<AboutSettingsData>({});
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/settings').then((r) => r.json()),
      fetch('/api/public/about').then((r) => r.json()),
    ])
      .then(([settingsData, aboutData]) => {
        setSiteSettings(settingsData.settings || {});
        setAboutSettings(aboutData.settings || {});
        setTeamMembers(aboutData.teamMembers || []);
        setMilestones(aboutData.milestones || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const businessName = siteSettings.businessName || 'Lamka Coaching Center';

  // Fallback text for about sections
  const storyText = aboutSettings.about_story || `${businessName} was founded in 2018 with a simple yet powerful belief — that every student, regardless of their background or circumstances, deserves access to quality education and the opportunity to build a better life. What started as a small coaching class in Lamka, Churachandpur, has grown into a full-service education hub that serves hundreds of students every year.`;
  const storyExtra = aboutSettings.about_story_extra || 'We offer a unique combination of services under one roof: expert coaching for competitive government exams like SSC, Banking, UPSC, and Railway; professional computer training programs ranging from basic CCC to advanced Python and Web Development; and dedicated study cabin spaces designed for focused, distraction-free learning. This holistic approach ensures that students can find everything they need to succeed without having to look elsewhere.';
  const storyClosing = aboutSettings.about_story_closing || "Our team of experienced educators, industry professionals, and dedicated support staff work together to create an environment where students don't just prepare for exams — they develop the skills, confidence, and discipline needed to excel in their careers and in life. With small batch sizes, personalized attention, and a result-oriented approach, we have helped over 500 students achieve their goals and secure their future.";
  const missionText = aboutSettings.about_mission || 'To provide accessible, high-quality education and training that empowers students from all backgrounds to achieve their career goals. We are committed to delivering practical, result-oriented coaching programs that combine expert instruction with modern teaching methods, ensuring every student is prepared to face competitive exams and professional challenges with confidence and competence.';
  const visionText = aboutSettings.about_vision || 'To become the most trusted and impactful education center in the region — a place where aspirations turn into achievements. We envision a future where every young person in our community has the skills, knowledge, and opportunity to build a successful career, whether in government service, the IT industry, or any field they choose to pursue. Through continuous innovation and unwavering dedication, we aim to be the catalyst for that transformation.';

  return (
    <PublicLayout>
      {/* ============================================
          HERO — About Us header
          ============================================ */}
      <section className="relative py-16 sm:py-24 bg-gray-950 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/90 via-cyan-700/90 to-sky-800/90" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%)',
            }}
          />
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
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> About Us
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Know Who{' '}
            <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
              We Are
            </span>
          </h1>
          <p className="mt-4 text-cyan-100/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            A passionate team dedicated to empowering students with the knowledge, skills, and
            confidence they need to build a brighter future.
          </p>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ============================================
          OUR STORY — Main description
          ============================================ */}
      <ScrollReveal>
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <Badge variant="secondary" className="mb-3 bg-cyan-100 text-cyan-700">
                Our Story
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Empowering Dreams.{' '}
                <span className="text-cyan-600">Building Futures.</span>
              </h2>
              <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
                <p>{storyText}</p>
                <p>{storyExtra}</p>
                <p>{storyClosing}</p>
              </div>
            </div>

            {/* Right: Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '500+', label: 'Students Trained', icon: <Users className="h-5 w-5" />, color: 'from-cyan-500 to-sky-500', bg: 'bg-cyan-50' },
                { value: '5+', label: 'Departments', icon: <GraduationCap className="h-5 w-5" />, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50' },
                { value: '16+', label: 'Courses Offered', icon: <BookOpen className="h-5 w-5" />, color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50' },
                { value: '20+', label: 'Study Cabins', icon: <DoorOpen className="h-5 w-5" />, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
                { value: '7+', label: 'Years of Service', icon: <Clock className="h-5 w-5" />, color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' },
                { value: '90%+', label: 'Satisfaction Rate', icon: <CheckCircle2 className="h-5 w-5" />, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`${stat.bg} border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow`}
                >
                  <div
                    className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-3 shadow-sm`}
                  >
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ============================================
          MISSION & VISION
          ============================================ */}
      <ScrollReveal delay={0.1}>
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 hover:shadow-lg transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-cyan-200">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">{missionText}</p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 hover:shadow-lg transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                <Eye className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">{visionText}</p>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ============================================
          CORE VALUES
          ============================================ */}
      <ScrollReveal delay={0.2}>
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3 bg-purple-100 text-purple-700">
              Our Values
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What We Stand For</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
              These core values guide every decision we make and every interaction we have with our
              students and community.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value) => (
              <div
                key={value.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-cyan-100 transition-all duration-300 text-center"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-cyan-50 text-cyan-600 mb-4">
                  {value.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ============================================
          OUR JOURNEY — Timeline
          ============================================ */}
      {milestones.length > 0 && (
        <section className="py-20 sm:py-28 bg-gray-950 relative overflow-hidden">
          {/* Background accents */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(6,182,212,0.05) 0%, transparent 40%)',
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Our Journey</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Milestones Along the Way</h2>
              <p className="mt-3 text-gray-400 max-w-xl mx-auto text-lg">
                From humble beginnings to a thriving education hub — every step has been driven by our
                commitment to student success.
              </p>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-white/10 sm:-translate-x-px" />

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className={`relative flex items-start gap-6 sm:gap-0 ${
                      index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                    }`}
                  >
                    {/* Dot */}
                    <div className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full bg-cyan-400 border-2 border-gray-950 -translate-x-1.5 sm:-translate-x-1.5 mt-1.5 z-10" />

                    {/* Content */}
                    <div className={`ml-10 sm:ml-0 sm:w-1/2 ${index % 2 === 0 ? 'sm:pr-12' : 'sm:pl-12'}`}>
                      <span className="inline-block px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-sm font-bold mb-2">
                        {milestone.year}
                      </span>
                      <p className="text-gray-300 leading-relaxed text-sm">{milestone.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          WHAT WE OFFER — 3 pillars
          ============================================ */}
      <ScrollReveal delay={0.3}>
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3 bg-cyan-100 text-cyan-700">
              Our Programs
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What We Offer</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
              Three comprehensive programs designed to meet the diverse needs of every student.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Competitive Exams */}
            <div className="group bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Competitive Exam Coaching</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Expert preparation for SSC, Banking, UPSC, and Railway exams with structured
                curriculum, regular mock tests, and result-oriented methodology.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 group-hover:gap-2 transition-all"
              >
                View Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Computer Training */}
            <div className="group bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-cyan-100/50 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <Badge className="bg-cyan-600 text-white text-[10px]">Popular</Badge>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-cyan-200">
                <Monitor className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Computer Training Center</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                From basic computer literacy to professional IT skills — CCC, Tally, Advanced Excel,
                Web Development, Python, and bilingual typing courses.
              </p>
              <Link
                href="/computer-training"
                className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 group-hover:gap-2 transition-all"
              >
                Explore Programs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Study Cabins */}
            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-green-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-green-200">
                <DoorOpen className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Study Cabin Spaces</h3>
              <p className="text-gray-500 leading-relaxed mb-4">
                Dedicated quiet study spaces with comfortable seating, proper lighting, and flexible
                timings. Available on hourly or monthly basis with affordable pricing.
              </p>
              <Link
                href="/cabins"
                className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 group-hover:gap-2 transition-all"
              >
                Book a Cabin <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ============================================
          PHOTO GALLERY
          ============================================ */}
      <ScrollReveal delay={0.4}>
        <GallerySection />
      </ScrollReveal>

      {/* ============================================
          OUR TEAM
          ============================================ */}
      {teamMembers.length > 0 && (
        <section className="py-20 sm:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-3 bg-cyan-100 text-cyan-700">
                Our Team
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Meet the People Behind Your Success</h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto text-lg">
                Our dedicated team of educators, professionals, and support staff are committed to
                helping every student reach their full potential.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-cyan-100 transition-all duration-300"
                >
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-sm text-cyan-600 font-medium">{member.role}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>

                  {/* Social links placeholder */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-cyan-50 hover:text-cyan-600 transition-colors cursor-pointer">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <span className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-cyan-50 hover:text-cyan-600 transition-colors cursor-pointer">
                      <Linkedin className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          CTA — Join Us
          ============================================ */}
      <section className="py-20 sm:py-28 bg-gray-950 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 60%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Be Part of Our{' '}
            <span className="bg-gradient-to-r from-sky-300 to-cyan-400 bg-clip-text text-transparent">
              Success Story
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
            Join hundreds of students who turned their aspirations into achievements with us. Your
            journey to success starts here.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold text-base shadow-xl shadow-cyan-900/30 rounded-xl"
              >
                Register Now <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/30 font-semibold text-base rounded-xl"
              >
                View Courses
              </Button>
            </Link>
          </div>

          {/* Contact info */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {siteSettings.businessPhone && (
              <a
                href={`tel:${siteSettings.businessPhone}`}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
              >
                <Phone className="h-4 w-4 text-cyan-400" />
                <span>{siteSettings.businessPhone}</span>
              </a>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span>{siteSettings.businessAddress || 'Lamka, Churachandpur, Manipur'}</span>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
