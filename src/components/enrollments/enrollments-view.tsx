'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDebouncedSearch } from '@/lib/hooks/use-debounced-search';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  UserPlus, Plus, Banknote, Check, X, ChevronRight, ChevronLeft,
  CalendarIcon, Loader2, Search, Receipt, Trash2, AlertTriangle, RotateCcw, Key, Copy, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateSecurePassword, generateUsernameSlug } from '@/lib/email';
import { formatCurrency, formatDate, addMonths } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface Department { id: string; name: string }
interface Course { id: string; name: string; departmentId: string; duration: string | null; totalFee: number; department: { name: string } }
interface BatchOption { id: string; batchName: string; courseId: string; timing: string; startDate: string; status: string }
interface StudentOption { id: string; name: string; phone: string }
interface EnrollmentPayment { id: string; amount: number; mode: string; receivedAt: string; notes: string | null; receiptNo: string | null }

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  batchId?: string | null;
  startDate: string;
  endDate: string | null;
  totalFee: number;
  paidAmount: number;
  status: string;
  notes: string | null;
  student: { id: string; name: string; phone: string };
  course: { id: string; name: string; department: { id: string; name: string } };
  batch?: { id: string; batchName: string; timing: string; startDate: string; status: string } | null;
  payments: EnrollmentPayment[];
}

type StepType = 'student' | 'course' | 'details' | 'confirm';

const STEPS: { key: StepType; label: string }[] = [
  { key: 'student', label: 'Student' },
  { key: 'course', label: 'Course' },
  { key: 'details', label: 'Details' },
  { key: 'confirm', label: 'Confirm' },
];

export default function EnrollmentsView() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState({ totalActive: 0, totalFees: 0, totalPaid: 0, totalOutstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEnrollment, setDeletingEnrollment] = useState<Enrollment | null>(null);
  const [deletingSubmitting, setDeletingSubmitting] = useState(false);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<StepType>('student');
  const [wizardStudentId, setWizardStudentId] = useState('');

  const [wizardCourseId, setWizardCourseId] = useState('');
  const [wizardBatchId, setWizardBatchId] = useState('');
  const [wizardDeptId, setWizardDeptId] = useState('');
  const [wizardStartDate, setWizardStartDate] = useState<Date>(new Date());
  const [wizardEndDate, setWizardEndDate] = useState<Date | undefined>(addMonths(new Date(), 6));
  const [wizardFee, setWizardFee] = useState('');
  const [wizardNotes, setWizardNotes] = useState('');
  const [wizardPayNow, setWizardPayNow] = useState(false);
  const [wizardPayAmount, setWizardPayAmount] = useState('');
  const [wizardPayMode, setWizardPayMode] = useState<'cash' | 'upi'>('cash');
  const [wizardPaymentDate, setWizardPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [wizardPayReceiptNo, setWizardPayReceiptNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inline student creation
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentAddress, setNewStudentAddress] = useState('');
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Options
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);

  // Payment dialog for existing enrollments
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payEnrollmentId, setPayEnrollmentId] = useState('');
  const [payStudentId, setPayStudentId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payReceiptNo, setPayReceiptNo] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (deptFilter !== 'all') params.set('departmentId', deptFilter);
      if (batchFilter !== 'all') params.set('batchId', batchFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/enrollments?${params.toString()}`);
      const json = await res.json();
      if (json.enrollments) setEnrollments(json.enrollments);
      if (json.stats) setStats(json.stats);
    } catch {
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [deptFilter, batchFilter, statusFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const json = await res.json();
      if (json.departments) setDepartments(json.departments);
    } catch { /* ignore */ }
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches');
      const json = await res.json();
      if (Array.isArray(json)) setBatches(json);
    } catch { /* ignore */ }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (wizardDeptId) params.set('departmentId', wizardDeptId);
      const res = await fetch(`/api/courses?${params.toString()}`);
      const json = await res.json();
      if (json.courses) setCourses(json.courses);
    } catch { /* ignore */ }
  }, [wizardDeptId]);

  const fetchStudentOptionsFn = useCallback(async (query: string, signal: AbortSignal) => {
    if (!wizardOpen || step !== 'student') return { students: [] };
    const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`, { signal });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  }, [wizardOpen, step]);

  const { 
    query: wizardStudentSearch, 
    setQuery: setWizardStudentSearch, 
    results: studentSearchRes, 
    setResults: setStudentSearchRes,
    loading: studentSearchLoading
  } = useDebouncedSearch<{ students: StudentOption[] }>(fetchStudentOptionsFn, 300, 2);

  const studentOptions = studentSearchRes?.students || [];

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);
  useEffect(() => { fetchDepartments(); fetchBatches(); }, [fetchDepartments, fetchBatches]);

  useEffect(() => {
    if (wizardOpen && step === 'course') fetchCourses();
  }, [wizardOpen, step, fetchCourses]);

  // Auto-set fee when course selected
  useEffect(() => {
    if (wizardCourseId && step === 'details') {
      const course = courses.find((c) => c.id === wizardCourseId);
      if (course) setWizardFee(String(course.totalFee / 100));
    }
  }, [wizardCourseId, step, courses]);

  const resetWizard = () => {
    setStep('student');
    setWizardStudentId('');
    setWizardStudentSearch('');
    setStudentSearchRes(null);
    setWizardCourseId('');
    setWizardBatchId('');
    setWizardDeptId('');
    setWizardStartDate(new Date());
    setWizardEndDate(addMonths(new Date(), 6));
    setWizardFee('');
    setWizardNotes('');
    setWizardPayNow(false);
    setWizardPayAmount('');
    setWizardPayMode('cash');
    setWizardPayReceiptNo('');
    setShowNewStudentForm(false);
    setNewStudentName('');
    setNewStudentPhone('');
  };

  const openWizard = () => {
    resetWizard();
    setWizardOpen(true);
  };

  const handleCreateInlineStudent = async () => {
    if (!newStudentName.trim() || !newStudentPhone.trim() || !newStudentEmail.trim()) {
      toast.error('Student name, phone, and email are required');
      return;
    }
    setCreatingStudent(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newStudentName.trim(),
          phone: newStudentPhone.trim(),
          email: newStudentEmail.trim(),
          username: newStudentUsername.trim() || undefined,
          password: newStudentPassword.trim() || undefined,
          address: newStudentAddress.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to create student'); return; }
      
      if (json.emailSent) {
        toast.success(`Student "${json.student.name}" created & login details emailed!`);
      } else {
        toast.success(`Student created! Temporary password: ${json.generatedPassword}`);
      }

      setWizardStudentId(json.student.id);
      setStudentSearchRes((prev) => prev ? { students: [...prev.students, json.student] } : { students: [json.student] });
      setShowNewStudentForm(false);
      setNewStudentName('');
      setNewStudentPhone('');
      setNewStudentEmail('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setNewStudentAddress('');
    } catch {
      toast.error('Failed to create student');
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleCreateEnrollment = async () => {
    if (!wizardStudentId || !wizardCourseId || !wizardBatchId || !wizardFee) {
      toast.error('Please select student, course, batch, and fee');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        action: 'create',
        studentId: wizardStudentId,
        courseId: wizardCourseId,
        batchId: wizardBatchId,
        startDate: wizardStartDate.toISOString().split('T')[0],
        totalFee: Number(wizardFee),
        notes: wizardNotes || undefined,
      };

      if (wizardEndDate) body.endDate = wizardEndDate.toISOString().split('T')[0];

      if (wizardPayNow && wizardPayAmount && Number(wizardPayAmount) > 0) {
        body.payNow = true;
        body.payAmount = Number(wizardPayAmount);
        body.payMode = wizardPayMode;
        body.paymentDate = wizardPaymentDate;
        body.payReceiptNo = wizardPayReceiptNo || undefined;
      }

      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to create enrollment'); return; }

      if (wizardPayNow && Number(wizardPayAmount) > 0) {
        toast.success(`Enrollment created with payment of ${formatCurrency(Number(wizardPayAmount) * 100)} recorded!`);
      } else {
        toast.success('Enrollment created successfully!');
      }
      setWizardOpen(false);
      resetWizard();
      fetchEnrollments();
    } catch {
      toast.error('Failed to create enrollment');
    } finally {
      setSubmitting(false);
    }
  };

  const openPayDialog = (enrollment: Enrollment) => {
    setPayEnrollmentId(enrollment.id);
    setPayStudentId(enrollment.studentId);
    setPayAmount(String((enrollment.totalFee - enrollment.paidAmount) / 100));
    setPayMode('cash');
    setPayNotes('');
    setPayReceiptNo('');
    setPayDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setPaySubmitting(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordPayment',
          id: payEnrollmentId,
          payAmount: Number(payAmount),
          payMode,
          notes: payNotes || undefined,
          receiptNo: payReceiptNo || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to record payment'); return; }
      toast.success(`Payment of ${formatCurrency(Number(payAmount) * 100)} recorded!`);
      setPayDialogOpen(false);
      fetchEnrollments();
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleStatusChange = async (enrollment: Enrollment, newStatus: string) => {
    try {
      const action = newStatus === 'completed' ? 'complete' : newStatus === 'active' ? 'active' : 'drop';
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: enrollment.id }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to update'); return; }
      toast.success(`Enrollment marked as ${newStatus}`);
      fetchEnrollments();
    } catch {
      toast.error('Failed to update enrollment');
    }
  };

  const openDeleteDialog = (enrollment: Enrollment) => {
    setDeletingEnrollment(enrollment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteEnrollment = async () => {
    if (!deletingEnrollment) return;
    setDeletingSubmitting(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deletingEnrollment.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to delete enrollment');
        return;
      }
      toast.success('Enrollment deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingEnrollment(null);
      fetchEnrollments();
    } catch {
      toast.error('Failed to delete enrollment');
    } finally {
      setDeletingSubmitting(false);
    }
  };

  const selectedStudent = studentOptions.find((s) => s.id === wizardStudentId);
  const selectedCourse = courses.find((c) => c.id === wizardCourseId);
  const selectedBatch = batches.find((b) => b.id === wizardBatchId);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const filteredEnrollments = enrollments.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.student.name.toLowerCase().includes(q) ||
      e.student.phone.includes(q) ||
      e.course.name.toLowerCase().includes(q) ||
      (e.batch?.batchName && e.batch.batchName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-bold text-gray-900">Enrollments</h2>
        </div>
        <Button onClick={openWizard} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-1.5" />
          New Enrollment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Active Enrollments</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalActive}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total Fees</p>
            <p className="text-xl font-bold text-cyan-600">{formatCurrency(stats.totalFees)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total Collected</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalOutstanding)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by student, phone, course, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Depts</SelectItem>
            {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.batchName} ({b.timing || 'Standard'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enrollment Cards */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : filteredEnrollments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-gray-400">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No enrollments found</p>
            <p className="text-sm mt-1">Enroll students in courses to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEnrollments.map((enrollment) => {
            const outstanding = enrollment.totalFee - enrollment.paidAmount;
            return (
              <Card
                key={enrollment.id}
                className={cn(
                  'border shadow-sm hover:shadow-md transition-shadow',
                  enrollment.status === 'active' && 'border-cyan-200',
                  enrollment.status === 'dropped' && 'opacity-60',
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        enrollment.status === 'active' && 'bg-cyan-100 text-cyan-800 border-cyan-200',
                        enrollment.status === 'completed' && 'bg-gray-100 text-gray-600 border-gray-200',
                        enrollment.status === 'dropped' && 'bg-red-100 text-red-800 border-red-200',
                      )}>
                        {enrollment.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {enrollment.course.department.name}
                      </Badge>
                      {enrollment.batch && (
                        <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200 gap-1">
                          <Layers className="h-3 w-3 text-cyan-600" />
                          {enrollment.batch.batchName} ({enrollment.batch.timing || 'Standard'})
                        </Badge>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 -mr-1 -mt-1 shrink-0"
                        title="Delete Enrollment"
                        onClick={() => openDeleteDialog(enrollment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-semibold text-gray-900">{enrollment.student.name}</p>
                    <p className="text-sm text-gray-500">{enrollment.course.name}</p>
                    <p className="text-xs text-gray-400">
                      {enrollment.student.phone} &bull; {formatDate(enrollment.startDate)}
                      {enrollment.endDate ? ` - ${formatDate(enrollment.endDate)}` : ''}
                    </p>
                  </div>

                  {/* Fee info */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-600 font-medium">Paid: {formatCurrency(enrollment.paidAmount)}</span>
                      {outstanding > 0 && (
                        <span className="text-red-600 font-medium">Due: {formatCurrency(outstanding)}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{formatCurrency(enrollment.totalFee)}</span>
                  </div>

                  {/* Actions */}
                  {enrollment.status === 'active' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {outstanding > 0 && (
                        <Button size="sm" variant="outline" onClick={() => openPayDialog(enrollment)}
                          className="text-xs h-9 text-cyan-700 border-cyan-300 hover:bg-cyan-50">
                          <Banknote className="h-3 w-3 mr-1" />
                          Record Payment
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(enrollment, 'completed')}
                        className="text-xs h-9">
                        <Check className="h-3 w-3 mr-1" /> Complete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(enrollment, 'dropped')}
                        className="text-xs h-9 text-red-600 border-red-200 hover:bg-red-50">
                        <X className="h-3 w-3 mr-1" /> Drop
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(enrollment, 'active')}
                        className="text-xs h-8 text-cyan-700 border-cyan-200 hover:bg-cyan-50">
                        <RotateCcw className="h-3 w-3 mr-1" /> Re-activate
                      </Button>
                      {isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => openDeleteDialog(enrollment)}
                          className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50">
                          <Trash2 className="h-3 w-3 mr-1" /> Delete Permanently
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Payment history */}
                  {enrollment.payments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Payments</p>
                      <div className="space-y-1">
                        {enrollment.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {formatDate(p.receivedAt)} &middot; <span className="uppercase">{p.mode}</span> &middot; {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={payMode === 'cash' ? 'default' : 'outline'}
                  className={payMode === 'cash' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                  onClick={() => setPayMode('cash')}>Cash</Button>
                <Button type="button" variant={payMode === 'upi' ? 'default' : 'outline'}
                  className={payMode === 'upi' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                  onClick={() => setPayMode('upi')}>UPI</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Receipt/Invoice No <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input placeholder="e.g. RCPT-1234" value={payReceiptNo} onChange={(e) => setPayReceiptNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={paySubmitting || !payAmount}
              className="bg-cyan-600 hover:bg-cyan-700">
              {paySubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Recording...</> : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { setWizardOpen(open); if (!open) resetWizard(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Enrollment</DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-4 px-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => { if (i < stepIndex) setStep(s.key); }}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium transition-colors',
                    i === stepIndex ? 'bg-cyan-600 text-white' : i < stepIndex ? 'bg-cyan-100 text-cyan-700 cursor-pointer' : 'bg-gray-100 text-gray-400',
                  )}
                >
                  {i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn('w-6 sm:w-10 h-0.5 mx-1', i < stepIndex ? 'bg-cyan-300' : 'bg-gray-200')} />
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[200px]">
            {/* Step 1: Student */}
            {step === 'student' && !showNewStudentForm && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-2">Select or search for a student</p>
                <Input placeholder="Search by name or phone..." value={wizardStudentSearch}
                  onChange={(e) => setWizardStudentSearch(e.target.value)} />
                <Button type="button" variant="outline"
                  className="w-full border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                  onClick={() => { setNewStudentName(''); setNewStudentPhone(''); setShowNewStudentForm(true); }}>
                  <UserPlus className="h-4 w-4 mr-2" /> Create New Student
                </Button>
                <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {studentSearchLoading ? (
                    <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto text-cyan-500" /></div>
                  ) : studentOptions.length === 0 ? (
                    <div className="text-center py-4"><p className="text-sm text-gray-400">No students found</p></div>
                  ) : studentOptions.map((s) => (
                    <button key={s.id} onClick={() => setWizardStudentId(s.id)}
                      className={cn('w-full p-3 rounded-lg text-left transition-colors',
                        wizardStudentId === s.id ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-gray-50')}>
                      <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'student' && showNewStudentForm && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Add a new student</p>
                <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                      <Input
                        placeholder="e.g. John Doe"
                        value={newStudentName}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setNewStudentName(newName);
                          if (!newStudentUsername || newStudentUsername === generateUsernameSlug(newStudentName)) {
                            setNewStudentUsername(generateUsernameSlug(newName));
                          }
                        }}
                        className="h-8.5 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                      <Input
                        placeholder="e.g. 9876543210"
                        value={newStudentPhone}
                        onChange={(e) => setNewStudentPhone(e.target.value)}
                        className="h-8.5 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Email Address *</Label>
                      <Input
                        type="email"
                        placeholder="student@example.com"
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        className="h-8.5 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700">Password</Label>
                        <button
                          type="button"
                          onClick={() => setNewStudentPassword(generateSecurePassword())}
                          className="text-[11px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"
                        >
                          <Key className="h-3 w-3" /> Auto-generate
                        </button>
                      </div>
                      <Input
                        placeholder="Leave blank to auto-generate"
                        value={newStudentPassword}
                        onChange={(e) => setNewStudentPassword(e.target.value)}
                        className="h-8.5 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Home Address (Optional)</Label>
                    <Input
                      placeholder="e.g. Lamka, Churachandpur"
                      value={newStudentAddress}
                      onChange={(e) => setNewStudentAddress(e.target.value)}
                      className="h-8.5 bg-white text-xs"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-cyan-200/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    Credentials will be sent via Brevo (<span className="font-mono">noreply@lamkacoaching.in</span>).
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" onClick={handleCreateInlineStudent}
                      disabled={creatingStudent || !newStudentName.trim() || !newStudentPhone.trim() || !newStudentEmail.trim()}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                      {creatingStudent ? 'Creating...' : 'Create & Select'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewStudentForm(false)}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Course & Batch */}
            {step === 'course' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Select course and batch</p>
                <Select value={wizardDeptId} onValueChange={(v) => { setWizardDeptId(v); setWizardCourseId(''); setWizardBatchId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Filter by department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {courses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No courses available</p>
                  ) : courses.map((c) => (
                    <button key={c.id} onClick={() => { setWizardCourseId(c.id); setWizardBatchId(''); setWizardFee(String(c.totalFee / 100)); }}
                      className={cn('w-full p-3 rounded-lg text-left transition-colors border',
                        wizardCourseId === c.id ? 'bg-cyan-50 border-cyan-300' : 'border-gray-200 hover:bg-gray-50')}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.department.name} {c.duration ? `• ${c.duration}` : ''}</p>
                        </div>
                        <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-0">{formatCurrency(c.totalFee)}</Badge>
                      </div>
                    </button>
                  ))}
                </div>

                {wizardCourseId && (
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <Label className="text-xs font-semibold text-gray-700">Select Batch *</Label>
                    {batches.filter((b) => b.courseId === wizardCourseId).length === 0 ? (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                        No batches created for this course yet. Please create a batch under Academics &gt; Batches first.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                        {batches
                          .filter((b) => b.courseId === wizardCourseId)
                          .map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setWizardBatchId(b.id)}
                              className={cn(
                                'w-full p-2.5 rounded-lg text-left text-xs transition-colors border flex items-center justify-between',
                                wizardBatchId === b.id
                                  ? 'bg-cyan-50 border-cyan-400 font-medium text-cyan-900'
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                              )}
                            >
                              <div>
                                <span className="font-semibold">{b.batchName}</span>
                                <span className="text-gray-500 ml-2">({b.timing || 'Standard'})</span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                Starts {formatDate(b.startDate)}
                              </Badge>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Details & Fee */}
            {step === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />{formatDate(wizardStartDate.toISOString())}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={wizardStartDate} onSelect={(d) => d && setWizardStartDate(d)} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />{wizardEndDate ? formatDate(wizardEndDate.toISOString()) : 'No end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={wizardEndDate} onSelect={setWizardEndDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Fee (₹)</Label>
                  <Input type="number" value={wizardFee} onChange={(e) => setWizardFee(e.target.value)} placeholder="e.g. 5000" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={wizardNotes} onChange={(e) => setWizardNotes(e.target.value)} placeholder="Optional enrollment notes..." rows={2} />
                </div>
              </div>
            )}

            {/* Step 4: Confirm & Pay */}
            {step === 'confirm' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Review & confirm enrollment</p>
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Student:</span><span className="font-medium">{selectedStudent?.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Course:</span><span className="font-medium">{selectedCourse?.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Department:</span><span className="font-medium">{selectedCourse?.department.name}</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Batch:</span>
                    <span className="font-medium text-cyan-800">{selectedBatch?.batchName || 'N/A'} ({selectedBatch?.timing || 'Standard'})</span>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Start:</span><span className="font-medium">{formatDate(wizardStartDate.toISOString())}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Fee:</span><span className="font-bold text-cyan-600">{formatCurrency(Number(wizardFee) * 100)}</span></div>
                </div>

                {/* Inline Payment with Backdating */}
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Record payment now?</Label>
                    <Button type="button" size="sm" variant={wizardPayNow ? 'default' : 'outline'}
                      className={wizardPayNow ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => { setWizardPayNow(!wizardPayNow); if (wizardPayNow) { setWizardPayAmount(''); setWizardPayReceiptNo(''); } }}>
                      {wizardPayNow ? 'Yes' : 'No'}
                    </Button>
                  </div>
                  {wizardPayNow && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Amount Paid (₹)</Label>
                          <Input type="number" value={wizardPayAmount} onChange={(e) => setWizardPayAmount(e.target.value)}
                            placeholder={`Max: ₹${wizardFee}`} min={0} max={Number(wizardFee)} className="h-8.5 bg-white text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Payment Date</Label>
                          <Input type="date" value={wizardPaymentDate} onChange={(e) => setWizardPaymentDate(e.target.value)}
                            className="h-8.5 bg-white text-xs" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Payment Mode</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant={wizardPayMode === 'cash' ? 'default' : 'outline'}
                              className={wizardPayMode === 'cash' ? 'bg-cyan-600 hover:bg-cyan-700 h-8.5 text-xs' : 'h-8.5 text-xs'}
                              onClick={() => setWizardPayMode('cash')}>Cash</Button>
                            <Button type="button" variant={wizardPayMode === 'upi' ? 'default' : 'outline'}
                              className={wizardPayMode === 'upi' ? 'bg-cyan-600 hover:bg-cyan-700 h-8.5 text-xs' : 'h-8.5 text-xs'}
                              onClick={() => setWizardPayMode('upi')}>UPI</Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Receipt No (Optional)</Label>
                          <Input placeholder="e.g. RCPT-1234" value={wizardPayReceiptNo} onChange={(e) => setWizardPayReceiptNo(e.target.value)}
                            className="h-8.5 bg-white text-xs" />
                        </div>
                      </div>

                      {wizardPayAmount && Number(wizardPayAmount) > 0 && (
                        <p className="text-xs text-gray-500 pt-1">
                          Outstanding after payment: ₹{Math.max(0, Number(wizardFee) - Number(wizardPayAmount)).toLocaleString('en-IN')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => {
              if (step === 'student') setWizardOpen(false);
              else setStep(STEPS[stepIndex - 1].key);
            }}>
              {step === 'student' ? 'Cancel' : <><ChevronLeft className="h-4 w-4 mr-1" />Back</>}
            </Button>
            {step !== 'confirm' ? (
              <Button
                onClick={() => setStep(STEPS[stepIndex + 1].key)}
                disabled={
                  (step === 'student' && !wizardStudentId) ||
                  (step === 'course' && (!wizardCourseId || !wizardBatchId))
                }
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreateEnrollment} disabled={submitting || !wizardFee}
                className="bg-cyan-600 hover:bg-cyan-700">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : 'Create Enrollment'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Enrollment Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Enrollment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-gray-600">
            <p>
              Are you sure you want to permanently delete the enrollment for{' '}
              <strong className="text-gray-900">{deletingEnrollment?.student?.name}</strong> in{' '}
              <strong className="text-gray-900">{deletingEnrollment?.course?.name}</strong>?
            </p>
            {deletingEnrollment && deletingEnrollment.payments && deletingEnrollment.payments.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ <strong>Warning:</strong> This enrollment has {deletingEnrollment.payments.length} payment record(s) totaling{' '}
                {formatCurrency(deletingEnrollment.paidAmount)}. Permanently deleting this enrollment will remove these payment records as well.
              </p>
            )}
            <p className="text-xs text-gray-500">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEnrollment}
              disabled={deletingSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
