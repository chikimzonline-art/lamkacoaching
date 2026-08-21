'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Activity,
  CreditCard,
  UserPlus,
  UserX,
  Building2,
  GraduationCap,
  Settings,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface DistinctUser {
  userName: string;
  userRole: string;
}

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [distinctUsers, setDistinctUsers] = useState<DistinctUser[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for detail modal
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedAction !== 'all') params.set('action', selectedAction);
      if (selectedRole !== 'all') params.set('userRole', selectedRole);
      if (selectedUser !== 'all') params.set('userName', selectedUser);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load audit logs');
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalLogs(data.pagination?.total || 0);
      if (data.distinctUsers) {
        setDistinctUsers(data.distinctUsers);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedAction, selectedRole, selectedUser, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedAction('all');
    setSelectedRole('all');
    setSelectedUser('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.info('No logs available to export');
      return;
    }

    const headers = ['Timestamp', 'Actor Name', 'Role', 'Action', 'Entity Type', 'Description', 'IP Address'];
    const rows = logs.map((log) => [
      `"${new Date(log.createdAt).toLocaleString('en-IN')}"`,
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.action}"`,
      `"${log.entityType}"`,
      `"${log.description.replace(/"/g, '""')}"`,
      `"${log.ipAddress || 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported successfully');
  };

  const getActionBadge = (action: string) => {
    if (action.startsWith('PAYMENT_')) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 gap-1 font-mono text-[11px]">
          <CreditCard className="h-3 w-3 text-emerald-600" />
          {action}
        </Badge>
      );
    }
    if (action.startsWith('STUDENT_')) {
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 gap-1 font-mono text-[11px]">
          <UserPlus className="h-3 w-3 text-purple-600" />
          {action}
        </Badge>
      );
    }
    if (action.startsWith('BOOKING_')) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1 font-mono text-[11px]">
          <Building2 className="h-3 w-3 text-blue-600" />
          {action}
        </Badge>
      );
    }
    if (action.startsWith('BATCH_') || action.startsWith('COURSE_') || action.startsWith('DEPARTMENT_')) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 font-mono text-[11px]">
          <GraduationCap className="h-3 w-3 text-amber-600" />
          {action}
        </Badge>
      );
    }
    if (action.startsWith('SETTINGS_')) {
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200 gap-1 font-mono text-[11px]">
          <Settings className="h-3 w-3 text-slate-600" />
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 font-mono text-[11px]">
        <Activity className="h-3 w-3 text-gray-500" />
        {action}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Badge className="bg-purple-600 text-white font-medium text-[10px] uppercase">Admin</Badge>;
      case 'staff':
        return <Badge className="bg-cyan-600 text-white font-medium text-[10px] uppercase">Staff</Badge>;
      case 'student':
        return <Badge className="bg-amber-600 text-white font-medium text-[10px] uppercase">Student</Badge>;
      default:
        return <Badge variant="secondary" className="font-medium text-[10px] uppercase">{role || 'System'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-sm text-gray-500">
                Immutable activity trail tracking staff and administrator actions in real time
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search actions, students, descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50/50 border-gray-200 text-sm"
              />
            </div>

            {/* Action Type */}
            <div>
              <Select value={selectedAction} onValueChange={(val) => { setSelectedAction(val); setPage(1); }}>
                <SelectTrigger className="bg-gray-50/50 border-gray-200 text-sm">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="PAYMENT_RECORDED">Payments Recorded</SelectItem>
                  <SelectItem value="PAYMENT_DELETED">Payments Deleted</SelectItem>
                  <SelectItem value="STUDENT_CREATED">Student Admissions</SelectItem>
                  <SelectItem value="STUDENT_UPDATED">Student Updates</SelectItem>
                  <SelectItem value="STUDENT_DELETED">Student Deletions</SelectItem>
                  <SelectItem value="BATCH_CREATED">Batches Created</SelectItem>
                  <SelectItem value="BATCH_UPDATED">Batches Updated</SelectItem>
                  <SelectItem value="BATCH_DELETED">Batches Deleted</SelectItem>
                  <SelectItem value="BOOKING_CREATED">Bookings Created</SelectItem>
                  <SelectItem value="BOOKING_APPROVED">Bookings Approved</SelectItem>
                  <SelectItem value="BOOKING_REJECTED">Bookings Rejected</SelectItem>
                  <SelectItem value="BOOKING_CANCELLED">Bookings Cancelled</SelectItem>
                  <SelectItem value="ENROLLMENT_CREATED">Enrollments Created</SelectItem>
                  <SelectItem value="ENROLLMENT_DELETED">Enrollments Deleted</SelectItem>
                  <SelectItem value="SETTINGS_UPDATED">Settings Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Operator / Staff User */}
            <div>
              <Select value={selectedUser} onValueChange={(val) => { setSelectedUser(val); setPage(1); }}>
                <SelectTrigger className="bg-gray-50/50 border-gray-200 text-sm">
                  <SelectValue placeholder="All Operators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {distinctUsers.map((u) => (
                    <SelectItem key={u.userName} value={u.userName}>
                      {u.userName} ({u.userRole})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role filter */}
            <div>
              <Select value={selectedRole} onValueChange={(val) => { setSelectedRole(val); setPage(1); }}>
                <SelectTrigger className="bg-gray-50/50 border-gray-200 text-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin Only</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date range & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Date Range:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="h-8 w-36 text-xs bg-gray-50/50 border-gray-200"
              />
              <span>to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="h-8 w-36 text-xs bg-gray-50/50 border-gray-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-500">
                Found <strong className="text-gray-900">{totalLogs}</strong> recorded event{totalLogs !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center text-gray-400">
            <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-40 text-purple-500" />
            <p className="text-base font-medium text-gray-700">No audit logs found</p>
            <p className="text-sm mt-1 text-gray-500">
              {debouncedSearch || selectedAction !== 'all' || selectedUser !== 'all' || startDate
                ? 'Try adjusting your filters or search terms'
                : 'Activity events will appear here as staff and admins perform actions.'}
            </p>
            {(debouncedSearch || selectedAction !== 'all' || selectedUser !== 'all' || startDate) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[170px] text-xs font-semibold text-gray-600">TIMESTAMP</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-gray-600">ACTOR</TableHead>
                  <TableHead className="w-[180px] text-xs font-semibold text-gray-600">ACTION</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">DESCRIPTION</TableHead>
                  <TableHead className="w-[90px] text-right text-xs font-semibold text-gray-600">DETAILS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-semibold text-gray-900 text-xs truncate max-w-[120px]">
                          {log.userName}
                        </span>
                        {getRoleBadge(log.userRole)}
                      </div>
                    </TableCell>

                    <TableCell>{getActionBadge(log.action)}</TableCell>

                    <TableCell className="text-xs text-gray-700 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{log.description}</p>
                      {log.ipAddress && (
                        <span className="text-[10px] text-gray-400 font-mono">IP: {log.ipAddress}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-purple-600"
                        onClick={() => setInspectLog(log)}
                        title="View JSON Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => (
              <Card key={log.id} className="border-0 shadow-sm bg-white p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-gray-900">{log.userName}</span>
                    {getRoleBadge(log.userRole)}
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="mb-2">{getActionBadge(log.action)}</div>

                <p className="text-xs text-gray-700 leading-relaxed mb-3">{log.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                  <span>{log.ipAddress ? `IP: ${log.ipAddress}` : log.entityType}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                    onClick={() => setInspectLog(log)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspect
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 text-xs text-gray-500">
              <div>
                Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inspect Log Details Modal */}
      <Dialog open={inspectLog !== null} onOpenChange={(open) => !open && setInspectLog(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <ShieldAlert className="h-5 w-5 text-purple-600" />
              Audit Event Breakdown
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Detailed payload and audit attributes captured at event execution
            </DialogDescription>
          </DialogHeader>

          {inspectLog && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Actor</span>
                  <span className="font-semibold text-gray-900">{inspectLog.userName} ({inspectLog.userRole})</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Action</span>
                  <span className="font-mono text-gray-900">{inspectLog.action}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="text-gray-700">{new Date(inspectLog.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">IP Address</span>
                  <span className="font-mono text-gray-700">{inspectLog.ipAddress || 'Not captured'}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1">Description</span>
                <p className="p-3 bg-purple-50 text-purple-950 rounded-lg border border-purple-100 font-medium">
                  {inspectLog.description}
                </p>
              </div>

              {inspectLog.details && (
                <div>
                  <span className="text-gray-500 font-medium block mb-1">Metadata & State Payload</span>
                  <pre className="p-3 bg-gray-950 text-gray-100 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed max-h-60">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(inspectLog.details), null, 2);
                      } catch {
                        return inspectLog.details;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
