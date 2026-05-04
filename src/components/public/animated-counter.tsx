'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number; // ms, default 2000
  suffix?: string; // e.g., '+', '%'
  prefix?: string; // e.g., '₹'
  className?: string;
}

export default function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '', className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const prevEndRef = useRef(end);
  const hasAnimatedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // If end changed from a previous value, reset animation state
    if (prevEndRef.current !== end) {
      hasAnimatedRef.current = false;
      prevEndRef.current = end;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          const startTime = performance.now();

          function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) {
              rafRef.current = requestAnimationFrame(animate);
            } else {
              setCount(end);
              rafRef.current = null;
            }
          }
          rafRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('en-IN')}{suffix}
    </span>
  );
}
