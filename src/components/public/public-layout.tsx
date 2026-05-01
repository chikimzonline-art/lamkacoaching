'use client';

import { usePathname } from 'next/navigation';
import PublicHeader from './public-header';
import PublicFooter from './public-footer';
import BackToTop from './back-to-top';
import ChatWidget from './chat-widget';
import AnnouncementTicker from './announcement-ticker';
import PageTransition from './page-transition';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-cyan-600 focus:text-white focus:px-4 focus:py-2 focus:rounded">
        Skip to main content
      </a>
      {!isAdmin && <AnnouncementTicker />}
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <PublicFooter />
      <BackToTop />
      <ChatWidget />
    </div>
  );
}
