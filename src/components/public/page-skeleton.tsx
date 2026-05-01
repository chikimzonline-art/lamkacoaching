'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface PageSkeletonProps {
  /** Variant of skeleton to show */
  variant?: 'home' | 'about' | 'courses' | 'default';
}

export default function PageSkeleton({ variant = 'default' }: PageSkeletonProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo skeleton */}
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="hidden sm:block space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
            {/* Nav skeleton */}
            <nav className="hidden md:flex items-center gap-1" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </nav>
            {/* Right side skeleton */}
            <div className="hidden md:flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            {/* Mobile menu skeleton */}
            <Skeleton className="md:hidden h-10 w-10 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1" id="main-content">
        {variant === 'home' && <HomeSkeleton />}
        {variant === 'about' && <AboutSkeleton />}
        {variant === 'courses' && <CoursesSkeleton />}
        {variant === 'default' && <DefaultSkeleton />}
      </main>

      {/* Footer Skeleton */}
      <footer className="bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-24 bg-gray-800" />
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-4 w-3/4 bg-gray-800" />
                <Skeleton className="h-4 w-5/6 bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="relative min-h-[90vh] flex items-center bg-gray-950 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <Skeleton className="h-7 w-48 rounded-full bg-gray-800" />
              <Skeleton className="h-14 w-80 bg-gray-800" />
              <Skeleton className="h-14 w-64 bg-gray-800" />
              <Skeleton className="h-6 w-full max-w-lg bg-gray-800" />
              <Skeleton className="h-6 w-3/4 max-w-lg bg-gray-800" />
              <div className="flex gap-3 pt-4">
                <Skeleton className="h-13 w-36 rounded-xl bg-gray-800" />
                <Skeleton className="h-13 w-40 rounded-xl bg-gray-800" />
              </div>
            </div>
            <div className="hidden lg:block">
              <Skeleton className="h-80 w-full rounded-2xl bg-gray-800" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar Skeleton */}
      <section className="py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-40" />
            ))}
          </div>
        </div>
      </section>

      {/* Cards Section Skeleton */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <Skeleton className="h-6 w-24 mx-auto rounded-full" />
            <Skeleton className="h-10 w-72 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-7 space-y-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-5 w-14 rounded-md" />
                  ))}
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AboutSkeleton() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="relative py-16 sm:py-24 bg-gray-950 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Skeleton className="h-7 w-24 mx-auto rounded-full bg-gray-800" />
          <Skeleton className="h-12 w-64 mx-auto bg-gray-800" />
          <Skeleton className="h-6 w-96 mx-auto bg-gray-800" />
        </div>
      </section>

      {/* Story Section Skeleton */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-2">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Skeleton */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CoursesSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <section className="bg-gradient-to-br from-cyan-600 to-sky-500 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <Skeleton className="h-10 w-80 mx-auto bg-white/20" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/15" />
          <Skeleton className="h-4 w-48 mx-auto bg-white/15" />
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter bar skeleton */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-full max-w-md rounded-lg" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-36 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>

          {/* Course cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function DefaultSkeleton() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <Skeleton className="h-6 w-24 mx-auto rounded-full" />
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
