import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Cabin Booking — Quiet Study Spaces in Lamka',
  description:
    'Book a quiet, comfortable study cabin in Lamka, Churachandpur, Manipur. Available hourly or monthly. Ideal for UPSC, SSC, banking exam preparation. Peaceful environment, proper lighting, flexible timings. Walk-ins welcome.',
  keywords: [
    'study cabin Lamka',
    'reading room Churachandpur',
    'study space Manipur',
    'study cabin booking',
    'quiet study room Churachandpur',
    'UPSC study cabin Manipur',
  ],
  openGraph: {
    title: 'Book a Study Cabin | Lamka Coaching Center',
    description:
      'Quiet study cabins available hourly or monthly in Lamka, Churachandpur. Perfect for exam preparation.',
    url: 'https://lamkacoaching.in/cabins',
  },
  alternates: {
    canonical: 'https://lamkacoaching.in/cabins',
  },
};

export default function CabinsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
