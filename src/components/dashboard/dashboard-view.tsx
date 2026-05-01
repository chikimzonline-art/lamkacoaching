'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DoorOpen, Calendar, Banknote, AlertCircle, Clock, Users, ArrowUpRight, AlertTriangle, ArrowRight, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/helpers';
import { useAppStore } from '@/store/app-store';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalCabins: number;
  availableCabins: number;
  occupiedCabins: number;
  totalStudents: number;
  activeBookingsCount: number;
  todayRevenue: number;
  todayEnrollmentRevenue: number;
  totalPending: number;
  totalEnrollments: number;
  enrollmentOutstanding: number;
  todayHourlyCount: number;
}

interface Booking {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  student: { name: string; phone: string };
  cabin: { cabinNum: number };
  totalAmount: number;
  paidAmount: number;
}

interface Payment {
  id: string;
  amount: number;
  mode: string;
  receivedAt: string;
  notes: string | null;
  student: { name: string };
  booking: { type: string; totalAmount: number; cabin: { cabinNum: number } };
}

interface EnrollmentPayment {
  id: string;
  amount: number;
  mode: string;
  receivedAt: string;
  notes: string | null;
  student: { name: string; phone: string };
  enrollment: { course: { name: string; department: { name: string } } };
}

interface PendingBooking {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  student: { name: string; phone: string };
  cabin: { cabinNum: number };
}

interface DashboardData {
  stats: DashboardStats;
  todayBookings: Booking[];
  exclusiveBookings: Booking[];
  expiringSoon: Booking[];
  recentPayments: Payment[];
  recentEnrollmentPayments: EnrollmentPayment[];
  pendingBookingRequests: PendingBooking[];
  pendingBookingCount: number;
}

/* ─────────────────────────────────────────────
   Mock Chart Data
   ───────────────────────────────────────────── */
const monthlyEnrollmentsData = [
  { month: 'Oct', enrollments: 12 },
  { month: 'Nov', enrollments: 18 },
  { month: 'Dec', enrollments: 15 },
  { month: 'Jan', enrollments: 22 },
  { month: 'Feb', enrollments: 28 },
  { month: 'Mar', enrollments: 24 },
];

const departmentData = [
  { name: 'Computer Training', value: 45, color: '#06b6d4' },
  { name: 'Competitive Exams', value: 30, color: '#0ea5e9' },
  { name: 'Banking Exams', value: 15, color: '#14b8a6' },
  { name: 'Study Cabins', value: 10, color: '#38bdf8' },
];

const revenueTrendData = [
  { month: 'Oct', revenue: 45000 },
  { month: 'Nov', revenue: 52000 },
  { month: 'Dec', revenue: 48000 },
  { month: 'Jan', revenue: 68000 },
  { month: 'Feb', revenue: 72000 },
  { month: 'Mar', revenue: 65000 },
];

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-[11px] sm:text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardView() {
  const { setActiveView } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.stats) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ListSkeleton rows={4} />
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-cyan-300" />
          <p>Failed to load dashboard data. Please try refreshing.</p>
        </CardContent>
      </Card>
    );
  }

  const { stats, todayBookings, exclusiveBookings, expiringSoon, recentPayments, recentEnrollmentPayments, pendingBookingRequests, pendingBookingCount } = data;

  return (
    <div className="space-y-6">
      {/* Pending Booking Requests Alert */}
      {pendingBookingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <h3 className="font-semibold text-amber-800">
                Pending Booking Requests
              </h3>
              <Badge className="bg-amber-200 text-amber-800 text-xs">
                {pendingBookingCount}
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveView('bookings')}
              className="bg-amber-600 hover:bg-amber-700 text-white self-start sm:self-auto"
            >
              Go to Bookings
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {pendingBookingRequests.length > 0 && (
            <div className="space-y-2">
              {pendingBookingRequests.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-100/60 border border-amber-200/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-900 truncate">{b.student.name}</p>
                    <p className="text-xs text-amber-700">
                      Cabin #{b.cabin.cabinNum} &bull; {b.type} &bull;{' '}
                      {b.type === 'hourly'
                        ? `${formatTime(b.startTime || '')} - ${formatTime(b.endTime || '')}`
                        : `${formatDate(b.startDate)}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50 shrink-0 ml-2">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards - 2x2 on mobile, 6 cols on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Cabins"
          value={String(stats.totalCabins)}
          icon={<DoorOpen className="h-5 w-5 text-cyan-600" />}
          color="bg-cyan-50"
          subtitle={`${stats.availableCabins} available`}
        />
        <StatCard
          title="Active Bookings"
          value={String(stats.activeBookingsCount)}
          icon={<Calendar className="h-5 w-5 text-cyan-600" />}
          color="bg-cyan-50"
          subtitle={`${stats.todayHourlyCount} hourly today`}
        />
        <StatCard
          title="Course Enrollments"
          value={String(stats.totalEnrollments)}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
          subtitle="Active students"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue + (stats.todayEnrollmentRevenue || 0))}
          icon={<Banknote className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Cabin Pending"
          value={formatCurrency(stats.totalPending)}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          color="bg-red-50"
          subtitle="Booking dues"
        />
        <StatCard
          title="Course Pending"
          value={formatCurrency(stats.enrollmentOutstanding || 0)}
          icon={<AlertCircle className="h-5 w-5 text-sky-500" />}
          color="bg-sky-50"
          subtitle="Enrollment dues"
        />
      </div>

      {/* ─────────────────────────────────────────────
         Charts Section
         ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly Enrollments Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-600" />
              Monthly Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyEnrollmentsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`${value} students`, 'Enrollments']}
                  />
                  <Bar dataKey="enrollments" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Students by Department Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-cyan-600" />
              Students by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-500">{value}</span>
                    )}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend Line Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, fill: '#06b6d4', stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Hourly Bookings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600" />
                Today&apos;s Bookings
              </CardTitle>
              <Badge variant="outline" className="text-xs border-cyan-200 text-cyan-700 bg-cyan-50">
                {todayBookings.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No bookings for today</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-cyan-50/50 hover:bg-cyan-100/60 transition-colors border border-cyan-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.student.name}</p>
                      <p className="text-xs text-gray-500">
                        Cabin {b.cabin.cabinNum} &bull; {formatTime(b.startTime || '')} -{' '}
                        {formatTime(b.endTime || '')}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-semibold text-cyan-600">
                        {formatCurrency(b.totalAmount)}
                      </p>
                      <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200">
                        {b.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exclusive Reservations */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-600" />
                Exclusive Reservations
              </CardTitle>
              <Badge variant="outline" className="text-xs border-cyan-200 text-cyan-700 bg-cyan-50">
                {exclusiveBookings.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {exclusiveBookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No exclusive reservations</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {exclusiveBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 hover:bg-red-100/60 transition-colors border border-red-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.student.name}</p>
                      <p className="text-xs text-gray-500">
                        Cabin {b.cabin.cabinNum} &bull;{' '}
                        {formatDate(b.startDate)} - {b.endDate ? formatDate(b.endDate) : 'Ongoing'}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-semibold text-gray-700">
                        {formatCurrency(b.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Paid: {formatCurrency(b.paidAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Expiring Soon */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-sky-500" />
                Expiring Soon
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200">
                {expiringSoon.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {expiringSoon.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No bookings expiring soon</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expiringSoon.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-sky-50 border border-sky-200"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.student.name}</p>
                      <p className="text-xs text-gray-500">
                        Cabin {b.cabin.cabinNum}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-semibold text-sky-700">
                        Expires {b.endDate ? formatDate(b.endDate) : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400">{b.student.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-cyan-600" />
                Recent Payments
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No recent payments</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-cyan-50/50 hover:bg-cyan-100/60 transition-colors border border-cyan-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.student.name}</p>
                      <p className="text-xs text-gray-500">
                        Cabin {p.booking.cabin.cabinNum} &bull;{' '}
                        {formatDate(p.receivedAt)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2 ml-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${p.mode === 'cash' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}
                      >
                        {p.mode.toUpperCase()}
                      </Badge>
                      <p className="text-sm font-semibold text-cyan-600">
                        {formatCurrency(p.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Enrollment Payments */}
      {recentEnrollmentPayments && recentEnrollmentPayments.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-purple-600" />
                Recent Course Payments
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentEnrollmentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 hover:bg-purple-100/60 transition-colors border border-purple-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.student.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.enrollment.course.name} &bull; {p.enrollment.course.department.name} &bull;{' '}
                      {formatDate(p.receivedAt)}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2 ml-3 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${p.mode === 'cash' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}
                    >
                      {p.mode.toUpperCase()}
                    </Badge>
                    <p className="text-sm font-semibold text-purple-600">
                      {formatCurrency(p.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
