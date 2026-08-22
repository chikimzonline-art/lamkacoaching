'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CalendarDays, LogIn, LogOut, Building2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  durationMinutes: number | null;
  cabin: { cabinNum: number; floor: number };
  bookingType: string;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return 'In Progress';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function AttendanceHistoryView() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<{ totalSessions: number; totalHours: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/attendance/self?limit=60');
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records || []);
          setStats({ totalSessions: data.totalSessions, totalHours: data.totalHours });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-cyan-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-700">{stats?.totalSessions ?? 0}</p>
              <p className="text-xs text-cyan-600">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center">
              <Timer className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{stats?.totalHours ?? 0}h</p>
              <p className="text-xs text-slate-500">Total Study Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records list */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attendance Log</CardTitle>
          <CardDescription>Your check-in and check-out history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-0 pb-2">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Clock className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No attendance records yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Scan the QR code at your study cabin desk to start tracking your sessions.
              </p>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
              >
                <div className={cn(
                  'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                  record.durationMinutes !== null ? 'bg-emerald-50' : 'bg-amber-50'
                )}>
                  <Building2 className={cn(
                    'h-4 w-4',
                    record.durationMinutes !== null ? 'text-emerald-600' : 'text-amber-600'
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">
                      Cabin #{record.cabin.cabinNum}
                    </p>
                    <span className="text-xs text-gray-400">·</span>
                    <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <LogIn className="h-3 w-3 text-emerald-500" />
                      {formatTime(record.checkIn)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <LogOut className="h-3 w-3 text-red-400" />
                      {formatTime(record.checkOut)}
                    </span>
                  </div>
                </div>

                <Badge className={cn(
                  'text-xs shrink-0',
                  record.durationMinutes !== null
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}>
                  {formatDuration(record.durationMinutes)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
