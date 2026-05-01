'use client';

import PublicHeader from './public-header';
import PublicFooter from './public-footer';
import BackToTop from './back-to-top';
import ChatWidget from './chat-widget';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <BackToTop />
      <ChatWidget />
    </div>
  );
}
