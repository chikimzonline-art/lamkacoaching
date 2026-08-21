'use client';

import { NotificationBell } from "@/components/notifications/notification-bell";
import { Suspense, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/ui/site-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { FirstLoginPasswordDialog } from "@/components/students/first-login-password-dialog";
import { 
  Home, 
  BookOpen, 
  Building2, 
  CreditCard, 
  LogOut, 
  User, 
  Bell, 
  Calendar, 
  HelpCircle, 
  GraduationCap, 
  Grid
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const desktopNavItems = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "My Enrollment & Booking", href: "/dashboard/my-learning", icon: BookOpen },
  { title: "Explore Courses", href: "/dashboard/courses", icon: GraduationCap },
  { title: "Explore Study Cabin", href: "/dashboard/cabins", icon: Building2 },
  { title: "History & Billing", href: "/dashboard/history", icon: CreditCard },
  { title: "Notices", href: "/dashboard/notices", icon: Bell },
  { title: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { title: "Support", href: "/dashboard/support", icon: HelpCircle },
];

const mobileCoreNavItems = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "My Learning", href: "/dashboard/my-learning", icon: BookOpen },
  { title: "Courses", href: "/dashboard/courses", icon: GraduationCap },
  { title: "Cabins", href: "/dashboard/cabins", icon: Building2 },
];

const mobileMoreNavItems = [
  { title: "Schedule", href: "/dashboard/schedule", icon: Calendar, description: "Upcoming classes and test timings" },
  { title: "History & Billing", href: "/dashboard/history", icon: CreditCard, description: "Payment history and pending dues" },
  { title: "Notices", href: "/dashboard/notices", icon: Bell, description: "Announcements and official updates" },
  { title: "Support", href: "/dashboard/support", icon: HelpCircle, description: "Raise tickets and get help" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isMoreActive = mobileMoreNavItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <SidebarProvider>
      {/* Desktop Sidebar */}
      <Sidebar variant="inset" className="hidden md:flex">
        <SidebarHeader className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 group transition-all duration-300">
            <SiteLogo />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Student Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {desktopNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="bg-slate-50 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 z-20 sticky top-0 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Desktop: Sidebar Trigger */}
            <SidebarTrigger className="hidden md:flex -ml-1" />
            
            {/* Mobile: Brand Logo & Title */}
            <Link href="/dashboard" className="flex md:hidden items-center gap-2">
              <SiteLogo />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-1 pl-2.5">
                  <span className="hidden md:inline-flex text-sm font-medium text-slate-700">
                    {session?.user?.name || 'Student'}
                  </span>
                  <UserAvatar user={session?.user} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-900">{session?.user?.name || 'Student'}</p>
                    <p className="text-xs leading-none text-slate-500">{session?.user?.email || 'Student Portal'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="w-full cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/history" className="w-full cursor-pointer flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing & Dues</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer flex items-center focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-5xl">
            <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading content...</div>}>
              {children}
            </Suspense>
          </div>
        </main>

        {/* Mobile Fixed Bottom Navigation Bar ("4 + More" Pattern) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-around">
            {mobileCoreNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => {
                    import('@/lib/capacitor/haptics').then(m => m.hapticFeedback.light());
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative min-w-[58px]",
                    isActive 
                      ? "text-primary font-semibold" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110 stroke-[2.25]" : "stroke-[1.75]")} />
                  <span className="text-[10px] mt-1 tracking-tight leading-none">{item.title}</span>
                  {isActive && (
                    <span className="h-1 w-1 rounded-full bg-primary mt-1" />
                  )}
                </Link>
              );
            })}

            {/* 5th "More" Tab Trigger */}
            <button
              type="button"
              onClick={() => {
                import('@/lib/capacitor/haptics').then(m => m.hapticFeedback.light());
                setMoreMenuOpen(true);
              }}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative min-w-[58px] cursor-pointer",
                isMoreActive 
                  ? "text-primary font-semibold" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Grid className={cn("h-5 w-5 transition-transform", isMoreActive ? "scale-110 stroke-[2.25]" : "stroke-[1.75]")} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Menu</span>
              {isMoreActive && (
                <span className="h-1 w-1 rounded-full bg-primary mt-1" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Slide-Up "More" Sheet */}
        <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl border-t border-slate-200 bg-white p-6 pb-10 max-h-[85vh]">
            <SheetHeader className="pb-4 border-b text-left">
              <SheetTitle className="text-lg font-bold text-slate-900">Student Menu</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {mobileMoreNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all",
                      isActive
                        ? "bg-slate-100/80 border-slate-300 font-medium text-primary shadow-xs"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center",
                      isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                  </Link>
                );
              })}

              <Link
                href="/dashboard/profile"
                onClick={() => setMoreMenuOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">My Profile</p>
                  <p className="text-xs text-slate-500 truncate">Account settings and details</p>
                </div>
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserAvatar user={session?.user} />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">{session?.user?.name || 'Student'}</p>
                  <p className="text-xs text-slate-500">{session?.user?.email || 'Student Portal'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMoreMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* First Login Password Prompt Dialog */}
        <FirstLoginPasswordDialog />
      </SidebarInset>
    </SidebarProvider>
  );
}

