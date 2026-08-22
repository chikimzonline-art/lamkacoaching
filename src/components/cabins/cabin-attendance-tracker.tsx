'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Clock, LogIn, LogOut, RefreshCw, User, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  date: string;
  booking: {
    student: { name: string; phone: string };
    cabin: { cabinNum: number; floor: number };
    type: string;
  };
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn) return '—';
  if (!checkOut) return 'In Progress';
  const min = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

export default function CabinAttendanceTracker() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.attendance || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchRecords(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeNow = records.filter((r) => r.checkIn && !r.checkOut);
  const completedToday = records.filter((r) => r.checkIn && r.checkOut);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{activeNow.length}</p>
              <p className="text-xs text-emerald-600">Currently In</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-200 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{records.length}</p>
              <p className="text-xs text-slate-500">Total Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live attendance log */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Today's Attendance</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchRecords(true)}
            disabled={refreshing}
            className="text-gray-500"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <Clock className="h-9 w-9 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No check-ins recorded today</p>
            </div>
          ) : (
            records.map((record) => {
              const isActive = record.checkIn && !record.checkOut;
              return (
                <div
                  key={record.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b last:border-b-0',
                    isActive && 'bg-emerald-50/50'
                  )}
                >
                  <div className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                    isActive ? 'bg-emerald-100' : 'bg-gray-100'
                  )}>
                    <User className={cn('h-4 w-4', isActive ? 'text-emerald-600' : 'text-gray-500')} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {record.booking.student.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Cabin #{record.booking.cabin.cabinNum}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <LogIn className="h-3 w-3 text-emerald-500" />
                        {formatTime(record.checkIn)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <LogOut className="h-3 w-3 text-red-400" />
                        {formatTime(record.checkOut)}
                      </span>
                    </div>
                  </div>

                  <Badge className={cn(
                    'text-xs shrink-0',
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  )}>
                    {formatDuration(record.checkIn, record.checkOut)}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
