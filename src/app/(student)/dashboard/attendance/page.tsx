import { requireStudent } from '@/lib/student-auth';
import AttendanceHistoryView from '@/components/attendance/attendance-history-view';
import { Clock } from 'lucide-react';

export default async function DashboardAttendancePage() {
  await requireStudent();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Clock className="h-7 w-7 text-cyan-600" />
          Attendance History
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your study sessions, check-in times, and total hours at the coaching center.
        </p>
      </div>
      <AttendanceHistoryView />
    </div>
  );
}
