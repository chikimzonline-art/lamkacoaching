import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register / Enroll — Lamka Coaching Center',
  description:
    'Enroll in competitive exam coaching (SSC, Banking, UPSC, Railway) or computer training courses (CCC, Tally, Python, Web Design) at Lamka Coaching Center, Churachandpur, Manipur. Simple online registration. New batches starting soon.',
  keywords: [
    'enroll coaching Lamka',
    'admission coaching Manipur',
    'register coaching center Churachandpur',
    'coaching admission 2025',
    'computer course admission Lamka',
  ],
  openGraph: {
    title: 'Register / Enroll | Lamka Coaching Center',
    description:
      'Enroll in coaching & computer training programs at Lamka Coaching Center. New batches starting soon in Churachandpur, Manipur.',
    url: 'https://lamkacoaching.in/register',
  },
  alternates: {
    canonical: 'https://lamkacoaching.in/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
