import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Competitive Exam Courses — SSC, Banking, UPSC, Railway',
  description:
    'Expert coaching for SSC CGL, IBPS PO/Clerk, SBI PO, UPSC Civil Services, and Railway exams in Lamka, Churachandpur, Manipur. Structured curriculum, regular mock tests, small batches with personal attention.',
  keywords: [
    'SSC CGL coaching Manipur',
    'IBPS coaching Churachandpur',
    'UPSC coaching Lamka',
    'Railway exam coaching Manipur',
    'banking exam coaching Churachandpur',
    'government exam coaching Manipur',
    'SBI PO coaching',
  ],
  openGraph: {
    title: 'Competitive Exam Courses | Lamka Coaching Center',
    description:
      'Expert coaching for SSC, Banking, UPSC & Railway exams. Structured curriculum with regular mock tests. Enroll at Lamka Coaching Center, Churachandpur, Manipur.',
    url: 'https://lamkacoaching.in/courses',
  },
  alternates: {
    canonical: 'https://lamkacoaching.in/courses',
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
