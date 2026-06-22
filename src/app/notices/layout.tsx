import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notices & Announcements — Lamka Coaching Center',
  description:
    'Stay updated with the latest notices, announcements, and important updates from Lamka Coaching Center in Churachandpur, Manipur. Exam schedules, new batch announcements, holiday notices, and more.',
  keywords: [
    'Lamka Coaching Center notices',
    'coaching announcements Churachandpur',
    'batch schedule Manipur',
    'exam notice Lamka',
    'coaching center updates',
  ],
  openGraph: {
    title: 'Notices & Announcements | Lamka Coaching Center',
    description:
      'Latest notices and updates from Lamka Coaching Center — exam schedules, batch announcements, holiday notices.',
    url: 'https://lamkacoaching.in/notices',
  },
  alternates: {
    canonical: 'https://lamkacoaching.in/notices',
  },
};

export default function NoticesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
