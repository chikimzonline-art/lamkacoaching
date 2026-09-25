'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Home,
  Menu,
  LogIn,
  LogOut,
  GraduationCap,
  DoorOpen,
  Monitor,
  Info,
  Bell,
  Sun,
  Moon,
  Search,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { motion, LayoutGroup } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { SiteLogo } from '@/components/ui/site-logo';
import { UserAvatar } from '@/components/ui/user-avatar';

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.25 }
  })
};

const navLinks = [
  { href: '/', label: 'Home', icon: Home, showOnDesktopIcon: false },
  { href: '/courses', label: 'Courses', icon: GraduationCap, showOnDesktopIcon: false },
  { href: '/computer-training', label: 'Computer Training', icon: Monitor, showOnDesktopIcon: true },
  { href: '/cabins', label: 'Study Cabins', icon: DoorOpen, showOnDesktopIcon: true },
  { href: '/about', label: 'About', icon: Info, showOnDesktopIcon: true },
  { href: '/notices', label: 'Notices', icon: Bell, showOnDesktopIcon: false },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-lg h-9 w-9 text-gray-700 dark:text-gray-300 hover:bg-surface-container-low dark:hover:bg-gray-800"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className={cn(
        'h-4 w-4 transition-all duration-300',
        theme === 'dark' ? 'scale-0 rotate-90' : 'scale-100 rotate-0'
      )} />
      <Moon className={cn(
        'absolute h-4 w-4 transition-all duration-300',
        theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
      )} />
    </Button>
  );
}

export default function PublicHeader({ onSearchOpen }: { onSearchOpen: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace('/login');
  };

  const userRole = (session?.user as any)?.role;
  const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';
  const dashboardHref = isAdminOrStaff ? '/admin' : '/dashboard';
  const dashboardLabel = isAdminOrStaff ? 'Admin Panel' : 'Dashboard';

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-surface-variant dark:border-gray-800 shadow-sm transition-all duration-300">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group transition-all duration-300">
            <SiteLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav role="navigation" aria-label="Main navigation" className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-200 border-b-2 rounded-t',
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400 border-cyan-600 dark:border-cyan-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  )}
                >
                  {link.showOnDesktopIcon && Icon && <Icon className="h-3.5 w-3.5 opacity-70" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Admin Login + Search + Theme Toggle + Register */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href="/register"
              className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 active:scale-95 text-white font-semibold text-xs px-5 py-2 rounded-lg shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200 inline-flex items-center justify-center cursor-pointer"
            >
              Register
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg h-9 w-9 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={onSearchOpen}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            
            {!session ? (
              <Link
                href="/login"
                className="border border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 gap-1.5 h-9 px-3.5 text-xs font-medium rounded-lg transition-all duration-200 active:scale-95 inline-flex items-center justify-center"
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={dashboardHref}>
                  <Button size="sm" variant="outline" className="border-gray-900 text-gray-900 dark:border-gray-100 dark:text-white">
                    {dashboardLabel}
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-900 dark:hover:text-white" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Quick Dashboard Button + Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            {session && (
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60 hover:bg-cyan-100 transition-colors"
                aria-label={`Go to ${dashboardLabel}`}
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{isAdminOrStaff ? 'Admin' : 'Dashboard'}</span>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-700 dark:text-gray-200" aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 flex flex-col justify-between bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                
                <div className="flex flex-col flex-1 overflow-y-auto">
                  {/* Mobile Menu Header */}
                  {session ? (
                    <div className="relative p-4 bg-gradient-to-br from-cyan-600 via-cyan-700 to-sky-800 text-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          user={session.user}
                          className="h-10 w-10 ring-2 ring-white/30 shrink-0"
                          fallbackClassName="bg-white text-cyan-700 font-bold"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate leading-tight">
                              {session.user?.name || 'Student'}
                            </p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20 uppercase tracking-wider text-cyan-100 shrink-0">
                              {userRole || 'Student'}
                            </span>
                          </div>
                          <p className="text-xs text-cyan-100/80 truncate mt-0.5">
                            {session.user?.email || (session.user as any)?.username || 'Logged in'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Return to Dashboard Button */}
                      <Link
                        href={dashboardHref}
                        onClick={() => setMobileOpen(false)}
                        className="mt-3.5 flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-xs border border-white/20 text-xs font-semibold transition-all text-white"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-cyan-200" />
                          Return to {dashboardLabel}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-cyan-200" />
                      </Link>
                    </div>
                  ) : (
                    <div className="relative px-4 py-5 bg-gradient-to-br from-cyan-600 to-sky-700 text-white">
                      <div className="flex items-center gap-2.5">
                        <SiteLogo size="mobile" variant="light" className="!block" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
                    </div>
                  )}

                  {/* Navigation Links */}
                  <LayoutGroup id="mobileNavGroup">
                    <nav role="navigation" aria-label="Mobile navigation" className="flex-1 px-3 py-4 space-y-1">
                      {/* Logged in Dashboard entry in Nav list */}
                      {session && (
                        <motion.div
                          custom={0}
                          variants={navItemVariants}
                          initial="hidden"
                          animate="visible"
                          className="relative mb-2"
                        >
                          <Link
                            href={dashboardHref}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50/80 dark:bg-cyan-950/40 hover:bg-cyan-100/70 dark:hover:bg-cyan-950/60 border border-cyan-200/60 dark:border-cyan-800/40 transition-colors"
                          >
                            <span className="flex items-center gap-3">
                              <LayoutDashboard className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                              <span>{dashboardLabel}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 opacity-60" />
                          </Link>
                        </motion.div>
                      )}

                      {navLinks.map((link, index) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                          <motion.div
                            key={link.href}
                            custom={session ? index + 1 : index}
                            variants={navItemVariants}
                            initial="hidden"
                            animate="visible"
                            className="relative"
                          >
                            <Link
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              aria-current={isActive ? 'page' : undefined}
                              className={cn(
                                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                                isActive
                                  ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50/90 dark:bg-cyan-950/50 font-semibold'
                                  : 'text-gray-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                              )}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeNavMobile"
                                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-600 dark:bg-cyan-400"
                                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                />
                              )}
                              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500')} />
                              <span>{link.label}</span>
                            </Link>
                          </motion.div>
                        );
                      })}

                      {/* Direct Register Link for Mobile */}
                      <motion.div
                        custom={navLinks.length + (session ? 1 : 0)}
                        variants={navItemVariants}
                        initial="hidden"
                        animate="visible"
                        className="pt-2 px-0.5"
                      >
                        <Link
                          href="/register"
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                            pathname === '/register'
                              ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50/90 dark:bg-cyan-950/50 font-semibold'
                              : 'text-gray-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                          )}
                        >
                          {pathname === '/register' && (
                            <motion.div
                              layoutId="activeNavMobile"
                              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-600 dark:bg-cyan-400"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                          <span className="flex items-center gap-3">
                            <GraduationCap className={cn('h-4 w-4 shrink-0', pathname === '/register' ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500')} />
                            <span>Register</span>
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                            Apply
                          </span>
                        </Link>
                      </motion.div>
                    </nav>
                  </LayoutGroup>
                </div>

                {/* Mobile Drawer Bottom Utilities & Actions */}
                <motion.div
                  custom={navLinks.length + 2}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="px-4 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3 bg-gray-50/50 dark:bg-gray-900/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Search</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-9 w-9 text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800"
                      onClick={() => { setMobileOpen(false); onSearchOpen(); }}
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Theme</span>
                    <ThemeToggle />
                  </div>

                  {!session ? (
                    <div className="space-y-2 pt-1">
                      <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full">
                        <Button className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white shadow-sm">
                          <LogIn className="h-4 w-4" />
                          Login to Account
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="block w-full">
                        <Button className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm">
                          <LayoutDashboard className="h-4 w-4" />
                          Go to {dashboardLabel}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => { setMobileOpen(false); handleLogout(); }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
