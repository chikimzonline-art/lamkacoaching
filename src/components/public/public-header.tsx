'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { BookOpen, Menu, LogIn, GraduationCap, DoorOpen, ChevronDown, Monitor, Info, Sun, Moon } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' }
  })
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/computer-training', label: 'Computer Training', icon: Monitor },
  { href: '/about', label: 'About', icon: Info },
  { href: '/notices', label: 'Notices' },
];

const registerLinks = [
  { href: '/register', label: 'Coaching Class', icon: GraduationCap },
  { href: '/cabins', label: 'Study Cabin', icon: DoorOpen },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-lg h-9 w-9"
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

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRegisterActive = pathname === '/register' || pathname === '/cabins';
  const isComputerTrainingActive = pathname === '/computer-training';

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group transition-all duration-300">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-cyan-600 text-white group-hover:bg-cyan-700 transition-colors group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">Lamka Coaching</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5 leading-tight">Center of Excellence</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50'
                      : 'text-gray-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}

            {/* Register Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isRegisterActive
                      ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50'
                      : 'text-gray-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30'
                  )}
                >
                  Register
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/register" className="flex items-center gap-2 cursor-pointer">
                    <GraduationCap className="h-4 w-4 text-cyan-600" />
                    Coaching Class
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cabins" className="flex items-center gap-2 cursor-pointer">
                    <DoorOpen className="h-4 w-4 text-cyan-600" />
                    Study Cabin
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Admin Login + Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50">
                <LogIn className="h-4 w-4" />
                Admin Login
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Enhanced mobile menu header with gradient */}
                <div className="relative px-4 py-5 bg-gradient-to-br from-cyan-600 to-sky-700">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/20 backdrop-blur-sm text-white">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm">Lamka Coaching</span>
                      <p className="text-[10px] text-cyan-100 -mt-0.5 leading-tight">Center of Excellence</p>
                    </div>
                  </div>
                  {/* Cyan gradient line separator */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
                </div>
                <LayoutGroup>
                <nav className="flex-1 px-3 py-4 space-y-1">
                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        custom={index}
                        variants={navItemVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative"
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 pl-5'
                              : 'text-gray-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30'
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeNav"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-6 rounded-full bg-cyan-500"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                          {Icon && <Icon className="h-4 w-4" />}
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Register Accordion for Mobile */}
                  <motion.div
                    custom={navLinks.length}
                    variants={navItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                  <Accordion type="single" collapsible className="px-0">
                    <AccordionItem value="register" className="border-b-0">
                      <AccordionTrigger
                        className={cn(
                          'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:no-underline',
                          isRegisterActive
                            ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50'
                            : 'text-gray-600 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30'
                        )}
                      >
                        <span className="flex items-center gap-0">
                          Register
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-1 pl-4 space-y-1">
                        {registerLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                pathname === link.href
                                  ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {link.label}
                            </Link>
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  </motion.div>
                </nav>
                </LayoutGroup>
                <motion.div
                  custom={navLinks.length + 1}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="px-3 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>
                    <ThemeToggle />
                  </div>
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                      <LogIn className="h-4 w-4" />
                      Admin Login
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
