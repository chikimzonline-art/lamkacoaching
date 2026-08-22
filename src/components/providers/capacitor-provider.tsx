'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { isNativePlatform } from '@/lib/capacitor/bridge';
import { syncBadgeFromUnreadCount } from '@/lib/capacitor/badge-manager';
import NetworkStatusProvider from './network-status-provider';

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const lastBackPressTimeRef = useRef<number>(0);

  // Native App Route Guard: Restrict Android users from public marketing website
  useEffect(() => {
    if (!isNativePlatform()) return;
    if (status === 'loading') return;

    const publicMarketingRoutes = [
      '/',
      '/about',
      '/computer-training',
      '/contact',
      '/faq',
      '/notices',
    ];

    const isPublicMarketingRoute =
      pathname === '/' ||
      (pathname !== '/login' &&
        pathname !== '/register' &&
        !pathname.startsWith('/dashboard') &&
        !pathname.startsWith('/admin') &&
        publicMarketingRoutes.includes(pathname));

    if (isPublicMarketingRoute) {
      if (status === 'authenticated') {
        const userRole = (session?.user as any)?.role;
        if (userRole === 'admin' || userRole === 'staff') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } else if (status === 'unauthenticated') {
        router.replace('/login');
      }
    }
  }, [pathname, status, session, router]);

  useEffect(() => {
    if (!isNativePlatform()) return;

    let isMounted = true;
    let appUrlSub: any = null;
    let backButtonSub: any = null;
    let appStateSub: any = null;

    async function initNativePlugins() {
      try {
        // 1. Status Bar Setup
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#050B44' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.warn('[CapacitorProvider] Failed to configure StatusBar', err);
      }

      try {
        // 2. Navigation Bar Setup
        const { NavigationBar } = await import('@capawesome/capacitor-navigation-bar');
        await NavigationBar.setColor({ color: '#0f172a' });
      } catch (err) {
        console.warn('[CapacitorProvider] Failed to configure NavigationBar', err);
      }

      try {
        // 3. Splash Screen Hide
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 400 });
      } catch (err) {
        console.warn('[CapacitorProvider] Failed to hide SplashScreen', err);
      }

      try {
        // 4. Hardware Back Button, Deep Linking & App Lifecycle
        const { App } = await import('@capacitor/app');

        // Deep link listener (App Links & custom scheme)
        appUrlSub = await App.addListener('appUrlOpen', (data) => {
          try {
            const url = new URL(data.url);
            const pathWithQuery = url.pathname + url.search + url.hash;
            if (pathWithQuery) {
              router.push(pathWithQuery);
            }
          } catch {
            const schemeMatch = data.url.replace(/^[a-zA-Z0-9_-]+:\/\//, '/');
            if (schemeMatch.startsWith('/')) {
              router.push(schemeMatch);
            }
          }
        });

        // App Lifecycle: Foreground / Background sync
        appStateSub = await App.addListener('appStateChange', async (state) => {
          if (state.isActive) {
            // App came to foreground: sync unread notifications & badge
            try {
              const res = await fetch('/api/notifications');
              if (res.ok) {
                const data = await res.json();
                if (typeof data.unreadCount === 'number') {
                  await syncBadgeFromUnreadCount(data.unreadCount);
                }
              }
            } catch {
              // Ignore network errors in background
            }
          }
        });

        // Hardware Back Button listener
        backButtonSub = await App.addListener('backButton', () => {
          // Check A: Dismiss open Radix / Shadcn dialogs, sheets, dropdowns first
          const openOverlay = document.querySelector(
            '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-radix-popper-content-wrapper]'
          );

          if (openOverlay) {
            const escEvent = new KeyboardEvent('keydown', {
              key: 'Escape',
              code: 'Escape',
              keyCode: 27,
              which: 27,
              bubbles: true,
              cancelable: true,
            });
            document.dispatchEvent(escEvent);
            return;
          }

          // Check B: Root Page Double-Tap Exit Guard
          const isRootPath =
            pathname === '/' ||
            pathname === '/dashboard' ||
            pathname === '/admin' ||
            pathname === '/login';

          if (isRootPath) {
            const now = Date.now();
            if (now - lastBackPressTimeRef.current < 2000) {
              App.exitApp();
            } else {
              lastBackPressTimeRef.current = now;
              toast('Press back again to exit', {
                duration: 2000,
                position: 'bottom-center',
              });
            }
          } else {
            // Deep page navigation: Go back in history
            router.back();
          }
        });
      } catch (err) {
        console.warn('[CapacitorProvider] Failed to configure App listeners', err);
      }

      try {
        // 5. Initialize Push Notifications & Channels
        const { initPushNotifications } = await import('@/lib/capacitor/push-notifications');
        await initPushNotifications((url) => {
          if (url && isMounted) {
            router.push(url);
          }
        });
      } catch (err) {
        console.warn('[CapacitorProvider] Failed to init PushNotifications', err);
      }
    }

    initNativePlugins();

    return () => {
      isMounted = false;
      if (appUrlSub) appUrlSub.remove();
      if (backButtonSub) backButtonSub.remove();
      if (appStateSub) appStateSub.remove();
    };
  }, [pathname, router]);

  // Sync offline timetable alarms & badge when student is logged in
  useEffect(() => {
    if (!isNativePlatform() || status !== 'authenticated') return;

    const userRole = (session?.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'staff') {
      // 1. Sync Timetable Alarms
      fetch('/api/student/enrollments')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.enrollments) {
            import('@/lib/capacitor/local-alarms').then((m) => {
              m.syncTimetableAlarms(data.enrollments);
            });
          }
        })
        .catch(() => {});

      // 2. Sync Launcher Badge
      fetch('/api/notifications')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (typeof data?.unreadCount === 'number') {
            syncBadgeFromUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [status, session, pathname]);

  return <NetworkStatusProvider>{children}</NetworkStatusProvider>;
}
