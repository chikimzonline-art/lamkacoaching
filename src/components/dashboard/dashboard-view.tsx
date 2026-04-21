'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DoorOpen, Calendar, Banknote, AlertCircle, Clock, Users, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/helpers';

interface DashboardStats {
  totalCabins: number;
  availableCabins: number;
  occupiedCabins: number;
  totalStudents: number;
  activeBookingsCount: number;
  todayRevenue: number;
  totalPending: number;
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

interface DashboardData {
  stats: DashboardStats;
  todayBookings: Booking[];
  exclusiveBookings: Booking[];
  expiringSoon: Booking[];
  recentPayments: Payment[];
}

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
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-orange-300" />
          <p>Failed to load dashboard data. Please try refreshing.</p>
        </CardContent>
      </Card>
    );
  }

  const { stats, todayBookings, exclusiveBookings, expiringSoon, recentPayments } = data;

  return (
    <div className="space-y-6">
      {/* Stats Cards - 2x2 on mobile, 4 cols on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Cabins"
          value={String(stats.totalCabins)}
          icon={<DoorOpen className="h-5 w-5 text-orange-600" />}
          color="bg-orange-50"
          subtitle={`${stats.availableCabins} available, ${stats.occupiedCabins} occupied`}
        />
        <StatCard
          title="Active Bookings"
          value={String(stats.activeBookingsCount)}
          icon={<Calendar className="h-5 w-5 text-orange-600" />}
          color="bg-orange-50"
          subtitle={`${stats.todayHourlyCount} hourly today`}
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon={<Banknote className="h-5 w-5 text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Pending Fees"
          value={formatCurrency(stats.totalPending)}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          color="bg-red-50"
          subtitle="Across all active bookings"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Hourly Bookings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Today&apos;s Bookings
              </CardTitle>
              <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
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
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50/50 hover:bg-orange-100/60 transition-colors border border-orange-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.student.name}</p>
                      <p className="text-xs text-gray-500">
                        Cabin {b.cabin.cabinNum} &bull; {formatTime(b.startTime || '')} -{' '}
                        {formatTime(b.endTime || '')}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-semibold text-orange-600">
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
                <Users className="h-4 w-4 text-orange-600" />
                Exclusive Reservations
              </CardTitle>
              <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
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
                <ArrowUpRight className="h-4 w-4 text-amber-500" />
                Expiring Soon
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
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
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.student.name}</p>
                      <p className="text-xs text-gray-500">
                        Cabin {b.cabin.cabinNum}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-semibold text-amber-700">
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
                <Banknote className="h-4 w-4 text-orange-600" />
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
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50/50 hover:bg-orange-100/60 transition-colors border border-orange-100"
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
                        className={`text-xs ${p.mode === 'cash' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}
                      >
                        {p.mode.toUpperCase()}
                      </Badge>
                      <p className="text-sm font-semibold text-orange-600">
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
    </div>
  );
}
