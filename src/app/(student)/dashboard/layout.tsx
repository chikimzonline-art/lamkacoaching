'use client';

import { NotificationBell } from "@/components/notifications/notification-bell";

import Link from "next/link"
import { SiteLogo } from "@/components/ui/site-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, BookOpen, MapPin, CreditCard, Menu, LogOut, User, Bell, Calendar, HelpCircle, UserCircle, Search } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
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
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "My Enrollment & Booking", href: "/dashboard/my-learning", icon: BookOpen },
  { title: "Explore Courses", href: "/dashboard/courses", icon: Search },
  { title: "Explore Study Cabin", href: "/dashboard/cabins", icon: MapPin },
  { title: "History & Billing", href: "/dashboard/history", icon: CreditCard },
  { title: "Notices", href: "/dashboard/notices", icon: Bell },
  { title: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { title: "Support", href: "/dashboard/support", icon: HelpCircle },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
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
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 z-10 sticky top-0">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-1 pl-3">
                  <span className="hidden md:inline-flex text-sm font-medium text-slate-700">{session?.user?.name || 'Student'}</span>
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || 'Student'} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">{session?.user?.name?.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-50/50 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
