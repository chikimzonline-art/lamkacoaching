'use client';

import { Badge } from '@/components/ui/badge';
import { Trophy, Quote } from 'lucide-react';

/* ─────────────────────────────────────────────
   Success Stories Data
   ───────────────────────────────────────────── */
const stories = [
  {
    name: 'Amit Kumar',
    exam: 'SSC CGL 2024',
    quote: 'The structured approach and regular mock tests helped me stay consistent.',
    result: 'AIR 347',
    initials: 'AK',
    gradient: 'from-cyan-500 to-sky-500',
  },
  {
    name: 'Sunita Devi',
    exam: 'IBPS Clerk 2024',
    quote: 'From basic concepts to cracking the exam, Lamka Center was my guide.',
    result: 'Selected',
    initials: 'SD',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    name: 'Rajesh Singh',
    exam: 'NIELIT CCC',
    quote: 'Scored 92% in CCC exam. The practical training approach is unmatched.',
    result: '92% Score',
    initials: 'RS',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Meera Patel',
    exam: 'UPSC NDA 2024',
    quote: 'Disciplined preparation with expert mentorship made all the difference.',
    result: 'AIR 189',
    initials: 'MP',
    gradient: 'from-purple-500 to-violet-500',
  },
];

/* ─────────────────────────────────────────────
   Success Stories Section Component
   ───────────────────────────────────────────── */
export default function SuccessStoriesSection() {
  return (
    <section className="py-20 sm:py-28 bg-gray-950 dark:bg-gray-900 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(6,182,212,0.05) 0%, transparent 40%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            <Trophy className="h-3 w-3 mr-1" /> Success Stories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Our Students, Our Pride
          </h2>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto text-lg">
            Real achievements from real students
          </p>
        </div>

        {/* Story Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stories.map((story) => (
            <div
              key={story.name}
              className="group bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 hover:border-cyan-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="h-6 w-6 text-cyan-500/30 mb-4" />

              {/* Quote */}
              <p className="text-gray-300 text-sm leading-relaxed mb-5">
                &ldquo;{story.quote}&rdquo;
              </p>

              {/* Student info */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${story.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {story.initials}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{story.name}</p>
                  <p className="text-xs text-cyan-400">{story.exam}</p>
                </div>
              </div>

              {/* Result badge */}
              <div className="pt-3 border-t border-white/10">
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs font-bold">
                  <Trophy className="h-3 w-3 mr-1" />
                  {story.result}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
