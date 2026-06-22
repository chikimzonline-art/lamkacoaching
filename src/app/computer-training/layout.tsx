import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Computer Training Courses — CCC, Tally, Python, Web Design',
  description:
    'Professional computer training in Lamka, Churachandpur, Manipur. NIELIT-certified CCC course, Tally Prime with GST, Advanced Excel, Web Design & Development, Python programming, and Hindi/English typing. Practical, job-ready programs.',
  keywords: [
    'CCC course Manipur',
    'Tally Prime course Churachandpur',
    'computer training Lamka',
    'NIELIT CCC Churachandpur',
    'Python course Manipur',
    'web design course Churachandpur',
    'computer institute Lamka',
    'typing course Manipur',
    'Advanced Excel training',
  ],
  openGraph: {
    title: 'Computer Training Courses | Lamka Coaching Center',
    description:
      'CCC, Tally Prime, Python, Web Design & more. NIELIT-certified computer training in Lamka, Churachandpur, Manipur.',
    url: 'https://lamkacoaching.in/computer-training',
  },
  alternates: {
    canonical: 'https://lamkacoaching.in/computer-training',
  },
};

export default function ComputerTrainingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
