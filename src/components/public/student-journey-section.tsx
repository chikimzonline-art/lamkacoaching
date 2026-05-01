'use client';

import { ClipboardList, BookOpen, PencilRuler, Trophy, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/public/scroll-reveal';
import Link from 'next/link';

const journeySteps = [
  {
    number: 1,
    title: 'Enroll',
    description: 'Choose your course and register',
    icon: ClipboardList,
  },
  {
    number: 2,
    title: 'Learn',
    description: 'Attend classes & practice',
    icon: BookOpen,
  },
  {
    number: 3,
    title: 'Practice',
    description: 'Mock tests & doubt clearing',
    icon: PencilRuler,
  },
  {
    number: 4,
    title: 'Achieve',
    description: 'Clear exams & get placed',
    icon: Trophy,
  },
];

export default function StudentJourneySection() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
          >
            Your Journey
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Our Students&apos; Journey
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            From enrollment to achievement — a clear path designed for your success.
          </p>
        </div>

        {/* Timeline — Desktop: Horizontal, Mobile: Vertical */}
        <div className="relative">
          {/* Desktop: Horizontal layout */}
          <div className="hidden md:grid grid-cols-4 gap-0 relative">
            {/* Connecting line behind circles */}
            <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-cyan-300 via-sky-300 to-cyan-300 dark:from-cyan-700 dark:via-sky-700 dark:to-cyan-700 z-0" />
            {/* Dotted overlay for style */}
            <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-[2px] z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.3) 1px, transparent 1px)', backgroundSize: '12px 2px' }} />

            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative flex flex-col items-center z-10">
                  {/* Numbered circle with gradient */}
                  <ScrollReveal delay={index * 0.15}>
                    <div className="relative mb-5">
                      <div className="h-[106px] w-[106px] rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/30">
                        <div className="h-[94px] w-[94px] rounded-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-1">
                          <span className="text-2xl font-extrabold bg-gradient-to-br from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                            {step.number}
                          </span>
                          <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Step content */}
                  <ScrollReveal delay={index * 0.15 + 0.1}>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[160px] mx-auto">
                        {step.description}
                      </p>
                    </div>
                  </ScrollReveal>
                </div>
              );
            })}
          </div>

          {/* Mobile: Vertical layout */}
          <div className="md:hidden relative">
            {/* Vertical connecting line */}
            <div className="absolute top-0 bottom-0 left-[36px] w-[2px] bg-gradient-to-b from-cyan-300 via-sky-300 to-cyan-300 dark:from-cyan-700 dark:via-sky-700 dark:to-cyan-700 z-0" />

            <div className="space-y-8">
              {journeySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <ScrollReveal key={step.number} delay={index * 0.12}>
                    <div className="relative flex items-start gap-5 z-10">
                      {/* Numbered circle */}
                      <div className="shrink-0">
                        <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/30">
                          <div className="h-[62px] w-[62px] rounded-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-0.5">
                            <span className="text-xl font-extrabold bg-gradient-to-br from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                              {step.number}
                            </span>
                            <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                        </div>
                      </div>

                      {/* Step content */}
                      <div className="pt-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 px-8 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/30 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
            >
              Start Your Journey Today
              <ArrowRight className="h-4.5 w-4.5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
