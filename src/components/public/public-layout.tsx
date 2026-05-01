'use client';

import { usePathname } from 'next/navigation';
import PublicHeader from './public-header';
import PublicFooter from './public-footer';
import BackToTop from './back-to-top';
import ChatWidget from './chat-widget';
import AnnouncementTicker from './announcement-ticker';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {!isAdmin && <AnnouncementTicker />}
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <BackToTop />
      <ChatWidget />
    </div>
  );
}
