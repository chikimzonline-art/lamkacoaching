'use client';

import { useAppStore, type ViewType } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  Calendar,
  Users,
  Banknote,
  Settings,
  Menu,
  BookOpen,
  BarChart3,
  LogOut,
  Shield,
  UserCircle,
  MoreHorizontal,
  Building2,
  GraduationCap,
  UserPlus,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import LoginPage from '@/components/auth/login-page';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DashboardView = dynamic(() => import('@/components/dashboard/dashboard-view'), {
  loading: () => <PageSkeleton />,
});
const CabinsView = dynamic(() => import('@/components/cabins/cabins-view'), {
  loading: () => <PageSkeleton />,
});
const StudentsView = dynamic(() => import('@/components/students/students-view'), {
  loading: () => <PageSkeleton />,
});
const BookingsView = dynamic(() => import('@/components/bookings/bookings-view'), {
  loading: () => <PageSkeleton />,
});
const PaymentsView = dynamic(() => import('@/components/payments/payments-view'), {
  loading: () => <PageSkeleton />,
});
const ReportsView = dynamic(() => import('@/components/reports/reports-view'), {
  loading: () => <PageSkeleton />,
});
const SettingsView = dynamic(() => import('@/components/settings/settings-view'), {
  loading: () => <PageSkeleton />,
});
const DepartmentsView = dynamic(() => import('@/components/departments/departments-view'), {
  loading: () => <PageSkeleton />,
});
const CoursesView = dynamic(() => import('@/components/courses/courses-view'), {
  loading: () => <PageSkeleton />,
});
const EnrollmentsView = dynamic(() => import('@/components/enrollments/enrollments-view'), {
  loading: () => <PageSkeleton />,
});
const NoticesView = dynamic(() => import('@/components/notices/notices-view'), {
  loading: () => <PageSkeleton />,
});

// Bottom nav items (5 primary + More)
const primaryNavItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
  { view: 'enrollments', label: 'Courses', icon: <GraduationCap className="h-5 w-5" /> },
  { view: 'bookings', label: 'Bookings', icon: <Calendar className="h-5 w-5" /> },
  { view: 'students', label: 'Students', icon: <Users className="h-5 w-5" /> },
  { view: 'payments', label: 'Payments', icon: <Banknote className="h-5 w-5" /> },
];

const moreNavItems: { view: ViewType; label: string; icon: React.ReactNode; adminOnly: boolean }[] = [
  { view: 'cabins', label: 'Cabins', icon: <DoorOpen className="h-5 w-5" />, adminOnly: false },
  { view: 'departments', label: 'Departments', icon: <Building2 className="h-5 w-5" />, adminOnly: true },
  { view: 'courses', label: 'Courses', icon: <GraduationCap className="h-5 w-5" />, adminOnly: false },
  { view: 'notices', label: 'Notices', icon: <Megaphone className="h-5 w-5" />, adminOnly: true },
  { view: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, adminOnly: false },
  { view: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, adminOnly: true },
];

const allSidebarItems: { view: ViewType; label: string; icon: React.ReactNode; adminOnly: boolean }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, adminOnly: false },
  { view: 'cabins', label: 'Cabins', icon: <DoorOpen className="h-5 w-5" />, adminOnly: false },
  { view: 'bookings', label: 'Bookings', icon: <Calendar className="h-5 w-5" />, adminOnly: false },
  { view: 'students', label: 'Students', icon: <Users className="h-5 w-5" />, adminOnly: false },
  { view: 'payments', label: 'Payments', icon: <Banknote className="h-5 w-5" />, adminOnly: false },
  { view: 'departments', label: 'Departments', icon: <Building2 className="h-5 w-5" />, adminOnly: true },
  { view: 'courses', label: 'Courses', icon: <GraduationCap className="h-5 w-5" />, adminOnly: false },
  { view: 'enrollments', label: 'Enrollments', icon: <UserPlus className="h-5 w-5" />, adminOnly: false },
  { view: 'notices', label: 'Notices', icon: <Megaphone className="h-5 w-5" />, adminOnly: true },
  { view: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, adminOnly: false },
  { view: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, adminOnly: true },
];

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-sky-50">
      <div className="text-center">
        <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-4" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

function PageHeader() {
  const { activeView } = useAppStore();
  const { user } = useAuthStore();
  const currentDate = useMemo(() =>
    new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }), []);

  const viewTitles: Record<ViewType, string> = {
    dashboard: 'Dashboard',
    cabins: 'Cabins',
    bookings: 'Bookings',
    students: 'Students',
    payments: 'Payments',
    departments: 'Departments',
    courses: 'Courses',
    enrollments: 'Enrollments',
    notices: 'Notices',
    reports: 'Reports',
    settings: 'Settings',
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{viewTitles[activeView]}</h1>
        <p className="text-sm text-gray-500">{currentDate}</p>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              user.role === 'admin'
                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                : 'border-blue-200 bg-blue-50 text-blue-700'
            }
          >
            <Shield className="h-3 w-3 mr-1" />
            {user.role === 'admin' ? 'Admin' : 'Staff'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-9">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-cyan-100 text-cyan-700">
                  <UserCircle className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline text-sm">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => useAuthStore.getState().logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}

function renderView(view: ViewType) {
  switch (view) {
    case 'dashboard': return <DashboardView />;
    case 'cabins': return <CabinsView />;
    case 'bookings': return <BookingsView />;
    case 'students': return <StudentsView />;
    case 'payments': return <PaymentsView />;
    case 'departments': return <DepartmentsView />;
    case 'courses': return <CoursesView />;
    case 'enrollments': return <EnrollmentsView />;
    case 'notices': return <NoticesView />;
    case 'reports': return <ReportsView />;
    case 'settings': return <SettingsView />;
    default: return <DashboardView />;
  }
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { activeView, setActiveView } = useAppStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const visibleItems = allSidebarItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-600 text-white">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Lamka Coaching</h1>
          <p className="text-xs text-gray-400">Center Management</p>
        </div>
      </div>
      <Separator className="bg-gray-700" />
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.view}
            onClick={() => {
              setActiveView(item.view);
              onItemClick?.();
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeView === item.view
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {user && (
        <>
          <Separator className="bg-gray-700" />
          <div className="px-3 py-3 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-600/20 text-cyan-400">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Lamka Coaching Center v1.0
        </p>
      </div>
    </div>
  );
}

// Bottom Navigation Bar for mobile
function BottomNav() {
  const { activeView, setActiveView } = useAppStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleMoreItems = moreNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {primaryNavItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px]',
                activeView === item.view
                  ? 'text-cyan-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {item.icon}
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px]',
              moreNavItems.some((item) => item.view === activeView)
                ? 'text-cyan-600'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>More Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-2">
            {visibleMoreItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setActiveView(item.view);
                  setMoreOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeView === item.view
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AuthenticatedApp() {
  const { activeView, sidebarOpen } = useAppStore();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin' && activeView === 'settings') {
      useAppStore.getState().setActiveView('dashboard');
    }
  }, [user, activeView]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-gray-900 border-gray-700">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Lamka Coaching</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 bg-gray-900 transition-all duration-300',
          sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'
        )}
      >
        {sidebarOpen && <SidebarContent />}
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 pb-20 lg:pb-0',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <PageHeader />
          {renderView(activeView)}
        </div>
      </main>

      {/* Footer - desktop only */}
      <footer
        className={cn(
          'hidden lg:block border-t border-gray-200 bg-white py-4 px-6 transition-all duration-300',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        )}
      >
        <p className="text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Lamka Coaching Center. All rights reserved.
        </p>
      </footer>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />
    </div>
  );
}

export default function Home() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}
