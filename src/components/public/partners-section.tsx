'use client';

import { Badge } from '@/components/ui/badge';
import { Handshake, Users, Building2, TrendingUp } from 'lucide-react';

/* ─────────────────────────────────────────────
   Partners Data
   ───────────────────────────────────────────── */
const partners = [
  {
    name: 'SSC',
    description: 'Staff Selection Commission',
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
  },
  {
    name: 'IBPS',
    description: 'Institute of Banking Personnel',
    color: 'text-green-700',
    border: 'border-green-200',
    bg: 'bg-green-50',
  },
  {
    name: 'UPSC',
    description: 'Union Public Service Commission',
    color: 'text-red-700',
    border: 'border-red-200',
    bg: 'bg-red-50',
  },
  {
    name: 'NIELIT',
    description: 'National Institute of Electronics',
    color: 'text-cyan-700',
    border: 'border-cyan-200',
    bg: 'bg-cyan-50',
  },
  {
    name: 'SBI',
    description: 'State Bank of India',
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
  },
  {
    name: 'Indian Railways',
    description: 'Government of India',
    color: 'text-orange-700',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
  },
  {
    name: 'TCS',
    description: 'Tata Consultancy Services',
    color: 'text-purple-700',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
  },
  {
    name: 'HDFC Bank',
    description: 'Leading Private Bank',
    color: 'text-red-700',
    border: 'border-red-200',
    bg: 'bg-red-50',
  },
];

/* ─────────────────────────────────────────────
   Stats Data
   ───────────────────────────────────────────── */
const stats = [
  { icon: <Users className="h-5 w-5 text-cyan-600" />, number: '100+', label: 'Students Placed' },
  { icon: <Building2 className="h-5 w-5 text-cyan-600" />, number: '25+', label: 'Organizations' },
  { icon: <TrendingUp className="h-5 w-5 text-cyan-600" />, number: '95%', label: 'Placement Rate' },
];

/* ─────────────────────────────────────────────
   Partners Section Component
   ───────────────────────────────────────────── */
export default function PartnersSection() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge variant="secondary" className="mb-3 bg-cyan-100 text-cyan-700">
            <Handshake className="h-3 w-3 mr-1" /> Our Partners
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Trusted By Leading Organizations
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            Our students are placed in top government and private organizations
          </p>
        </div>

        {/* Marquee Container */}
        <div className="relative overflow-hidden mb-14">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="flex group/marquee">
            <div className="flex gap-4 sm:gap-5 shrink-0 animate-scroll-left group-hover/marquee:[animation-play-state:paused]">
              {/* First set */}
              {partners.map((partner) => (
                <div
                  key={`a-${partner.name}`}
                  className={`flex flex-col items-center justify-center h-20 w-36 sm:w-44 rounded-xl border p-4 ${partner.bg} dark:bg-gray-800/50 ${partner.border} dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shrink-0`}
                >
                  <span className={`font-bold text-base ${partner.color} dark:text-white`}>{partner.name}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 text-center leading-tight">{partner.description}</span>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {partners.map((partner) => (
                <div
                  key={`b-${partner.name}`}
                  className={`flex flex-col items-center justify-center h-20 w-36 sm:w-44 rounded-xl border p-4 ${partner.bg} dark:bg-gray-800/50 ${partner.border} dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shrink-0`}
                >
                  <span className={`font-bold text-base ${partner.color} dark:text-white`}>{partner.name}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 text-center leading-tight">{partner.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center justify-center gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <div className="flex items-center gap-3 px-6 sm:px-10 py-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stat.number}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
              </div>
              {i < stats.length - 1 && (
                <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
