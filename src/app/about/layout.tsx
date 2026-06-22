import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — Lamka Coaching Center, Churachandpur, Manipur',
  description:
    'Learn about Lamka Coaching Center — founded in 2018 in Lamka, Churachandpur, Manipur. Our mission, vision, team, and journey of empowering 500+ students through expert competitive exam coaching and professional computer training.',
  keywords: [
    'Lamka Coaching Center about',
    'coaching center Churachandpur',
    'education center Manipur',
    'coaching center history',
    'student success stories Manipur',
  ],
  openGraph: {
    title: 'About Us | Lamka Coaching Center',
    description:
      'Founded in 2018 in Lamka, Churachandpur, Manipur. 500+ students trained across competitive exams and computer programs.',
    url: 'https://lamkacoaching.in/about',
  },
  alternates: {
    canonical: 'https://lamkacoaching.in/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
