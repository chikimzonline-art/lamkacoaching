'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Menu, LogIn, GraduationCap, DoorOpen, ChevronDown, Monitor } from 'lucide-react';
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

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/computer-training', label: 'Computer Training', icon: Monitor },
  { href: '/notices', label: 'Notices' },
];

const registerLinks = [
  { href: '/register', label: 'Coaching Class', icon: GraduationCap },
  { href: '/cabins', label: 'Study Cabin', icon: DoorOpen },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRegisterActive = pathname === '/register' || pathname === '/cabins';
  const isComputerTrainingActive = pathname === '/computer-training';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-cyan-600 text-white group-hover:bg-cyan-700 transition-colors">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 leading-tight">Lamka Coaching</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5 leading-tight">Center of Excellence</p>
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
                      ? 'text-cyan-700 bg-cyan-50'
                      : 'text-gray-600 hover:text-cyan-700 hover:bg-cyan-50/50'
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
                      ? 'text-cyan-700 bg-cyan-50'
                      : 'text-gray-600 hover:text-cyan-700 hover:bg-cyan-50/50'
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

          {/* Desktop Admin Login */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50">
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
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-600 text-white">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">Lamka Coaching</span>
                  </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          pathname === link.href
                            ? 'text-cyan-700 bg-cyan-50'
                            : 'text-gray-600 hover:text-cyan-700 hover:bg-cyan-50/50'
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {link.label}
                      </Link>
                    );
                  })}

                  {/* Register Accordion for Mobile */}
                  <Accordion type="single" collapsible className="px-0">
                    <AccordionItem value="register" className="border-b-0">
                      <AccordionTrigger
                        className={cn(
                          'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:no-underline',
                          isRegisterActive
                            ? 'text-cyan-700 bg-cyan-50'
                            : 'text-gray-600 hover:text-cyan-700 hover:bg-cyan-50/50'
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
                                  ? 'text-cyan-700 bg-cyan-50'
                                  : 'text-gray-500 hover:text-cyan-700 hover:bg-cyan-50/50'
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
                </nav>
                <div className="px-3 pb-6 pt-3 border-t border-gray-100">
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                      <LogIn className="h-4 w-4" />
                      Admin Login
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
