'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Camera,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const galleryItems = [
  {
    title: 'Computer Lab',
    description: 'State-of-the-art computers with latest software for hands-on practice',
    image: '/gallery/gallery-computer-lab.jpg',
    colSpan: 'md:col-span-2',
    rowSpan: 'md:row-span-2',
  },
  {
    title: 'Study Cabins',
    description: 'Private, distraction-free study spaces with comfortable seating',
    image: '/gallery/gallery-study-cabin.jpg',
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Classroom',
    description: 'Spacious classrooms equipped with modern teaching aids',
    image: '/gallery/gallery-classroom.jpg',
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Library Corner',
    description: 'Curated collection of books and study materials for all courses',
    image: '/gallery/gallery-library.jpg',
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Reception',
    description: 'Friendly staff ready to assist with admissions and queries',
    image: '/gallery/gallery-reception.jpg',
    colSpan: '',
    rowSpan: '',
  },
  {
    title: 'Discussion Area',
    description: 'Collaborative space for group study and peer learning',
    image: '/gallery/gallery-discussion.jpg',
    colSpan: 'md:col-span-2',
    rowSpan: '',
  },
];

export default function GallerySection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const currentItem = galleryItems[lightboxIndex];

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
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`
                relative rounded-2xl overflow-hidden min-h-[200px]
                ${item.colSpan} ${item.rowSpan}
                cursor-pointer
                hover:scale-[1.02] hover:shadow-xl
                transition-all duration-300
                group
              `}
              onClick={() => openLightbox(index)}
              role="button"
              tabIndex={0}
              aria-label={`View ${item.title} in lightbox`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(index);
                }
              }}
            >
              {/* Real Image */}
              <Image
                src={item.image}
                alt={`${item.title} at Lamka Coaching Center - ${item.description}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />

              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Zoom icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Bottom Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 sm:p-5">
                <h3 className="text-white font-bold text-base sm:text-lg">{item.title}</h3>
                <p className="text-white/80 text-xs sm:text-sm mt-0.5 line-clamp-2">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/about">
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

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="sm:max-w-5xl max-w-[calc(100%-1rem)] p-0 bg-black/95 border-white/10 overflow-hidden rounded-2xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {currentItem?.title} - Gallery Image
          </DialogTitle>
          <DialogDescription className="sr-only">
            {currentItem?.description}
          </DialogDescription>

          <div className="relative w-full">
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="relative w-full aspect-[16/10]"
              >
                <Image
                  src={currentItem?.image || ''}
                  alt={currentItem?.title || 'Gallery image'}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Caption bar */}
            <div className="bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 absolute bottom-0 left-0 right-0">
              <h3 className="text-white font-bold text-lg sm:text-xl">{currentItem?.title}</h3>
              <p className="text-white/70 text-sm sm:text-base mt-1">{currentItem?.description}</p>
              <div className="flex items-center gap-2 mt-3">
                {galleryItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === lightboxIndex
                        ? 'w-6 bg-cyan-400'
                        : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
