'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  {
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
  },
  {
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
  {
    text: 'Education is the most powerful weapon which you can use to change the world.',
    author: 'Nelson Mandela',
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: 'Sam Levenson',
  },
  {
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
  {
    text: 'It always seems impossible until it\'s done.',
    author: 'Nelson Mandela',
  },
  {
    text: 'Your limitation—it\'s only your imagination.',
    author: 'Unknown',
  },
  {
    text: 'Push yourself, because no one else is going to do it for you.',
    author: 'Unknown',
  },
];

export default function MotivationalQuotesSection() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = quotes.length;

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 8000);
  }, [total]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoPlay]);

  const goTo = (index: number) => {
    setCurrent(index);
    startAutoPlay();
  };

  const prev = () => goTo((current - 1 + total) % total);
  const next = () => goTo((current + 1) % total);

  const q = quotes[current];

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(circle at 85% 75%, rgba(14,165,233,0.06) 0%, transparent 40%)',
      }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-800/30">
            <Sparkles className="h-3 w-3 mr-1" /> Daily Inspiration
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Words That Inspire Success
          </h2>
        </div>

        {/* Quote Display */}
        <div className="relative">
          {/* Large decorative quotation marks */}
          <div className="absolute -top-8 -left-4 sm:-left-8 text-8xl text-cyan-200/30 dark:text-cyan-700/20 font-serif select-none pointer-events-none leading-none">
            &ldquo;
          </div>
          <div className="absolute -bottom-8 -right-4 sm:-right-8 text-8xl text-cyan-200/30 dark:text-cyan-700/20 font-serif select-none pointer-events-none leading-none rotate-180">
            &ldquo;
          </div>

          {/* Quote content with animation */}
          <div className="relative bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-cyan-100/50 dark:border-cyan-800/20 p-8 sm:p-12 text-center min-h-[200px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <p className="text-2xl sm:text-3xl font-serif italic text-gray-800 dark:text-gray-200 leading-relaxed max-w-2xl mx-auto">
                  &ldquo;{q.text}&rdquo;
                </p>
                <p className="mt-6 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                  — {q.author}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-6 z-10 h-10 w-10 rounded-full bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/20 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all shadow-sm"
            aria-label="Previous quote"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-6 z-10 h-10 w-10 rounded-full bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/20 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all shadow-sm"
            aria-label="Next quote"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 bg-cyan-500'
                  : 'w-2 bg-cyan-200 dark:bg-cyan-800 hover:bg-cyan-300 dark:hover:bg-cyan-700'
              }`}
              aria-label={`Go to quote ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
