'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Monitor,
  DoorOpen,
  GraduationCap,
  BookOpen,
  Users,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const galleryItems = [
  {
    title: 'Computer Lab',
    description: 'State-of-the-art computers with latest software for hands-on practice',
    gradient: 'from-cyan-400 to-blue-500',
    icon: Monitor,
    colSpan: 'md:col-span-2',
    rowSpan: 'md:row-span-2',
  },
  {
    title: 'Study Cabins',
    description: 'Private, distraction-free study spaces with comfortable seating',
    gradient: 'from-green-400 to-emerald-500',
    icon: DoorOpen,
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Classroom',
    description: 'Spacious classrooms equipped with modern teaching aids',
    gradient: 'from-purple-400 to-violet-500',
    icon: GraduationCap,
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Library Corner',
    description: 'Curated collection of books and study materials for all courses',
    gradient: 'from-amber-400 to-orange-500',
    icon: BookOpen,
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Reception',
    description: 'Friendly staff ready to assist with admissions and queries',
    gradient: 'from-rose-400 to-pink-500',
    icon: Users,
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Discussion Area',
    description: 'Collaborative space for group study and peer learning',
    gradient: 'from-teal-400 to-cyan-500',
    icon: MessageSquare,
    colSpan: 'md:col-span-2',
    rowSpan: '',
  },
];

export default function GallerySection() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge variant="secondary" className="mb-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
            <Camera className="h-3.5 w-3.5 mr-1.5" />
            Our Campus
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Take a Look Inside</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            A glimpse of our modern facilities designed for focused learning
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[minmax(200px,auto)]">
          {galleryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`
                  relative rounded-2xl overflow-hidden min-h-[200px]
                  bg-gradient-to-br ${item.gradient}
                  ${item.colSpan} ${item.rowSpan}
                  cursor-pointer
                  hover:scale-[1.02] hover:shadow-xl
                  transition-all duration-300
                `}
              >
                {/* Centered Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-16 w-16 text-white/40" />
                </div>

                {/* Bottom Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white font-bold text-lg">{item.title}</h3>
                  <p className="text-white/80 text-sm mt-0.5">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-300 dark:hover:border-cyan-700 font-semibold rounded-xl"
            >
              Visit us for a campus tour
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
