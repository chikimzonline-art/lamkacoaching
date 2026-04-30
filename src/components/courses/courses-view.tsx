'use client';

import { useEffect, useState, useCallback } from 'react';
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
import {
  GraduationCap, Plus, Pencil, Trash2, Loader2, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/helpers';

interface Department {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
  departmentId: string;
  duration: string | null;
  totalFee: number;
  description: string | null;
  status: string;
  department: { id: string; name: string };
  _count: { enrollments: number };
}

export default function CoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [formName, setFormName] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formFee, setFormFee] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (deptFilter !== 'all') params.set('departmentId', deptFilter);
      const res = await fetch(`/api/courses?${params.toString()}`);
      const json = await res.json();
      if (json.courses) setCourses(json.courses);
    } catch {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [deptFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const json = await res.json();
      if (json.departments) setDepartments(json.departments);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const resetForm = () => {
    setEditing(null);
    setFormName('');
    setFormDeptId('');
    setFormDuration('');
    setFormFee('');
    setFormDesc('');
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setFormName(course.name);
    setFormDeptId(course.departmentId);
    setFormDuration(course.duration || '');
    setFormFee(String(course.totalFee / 100));
    setFormDesc(course.description || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formDeptId || !formFee) {
      toast.error('Name, department, and fee are required');
      return;
    }
    setSaving(true);
    try {
      const body = editing
        ? {
            action: 'update',
            id: editing.id,
            name: formName.trim(),
            departmentId: formDeptId,
            duration: formDuration.trim() || null,
            totalFee: Number(formFee),
            description: formDesc.trim() || null,
          }
        : {
            action: 'create',
            name: formName.trim(),
            departmentId: formDeptId,
            duration: formDuration.trim() || null,
            totalFee: Number(formFee),
            description: formDesc.trim() || null,
          };

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to save course');
        return;
      }
      toast.success(editing ? 'Course updated' : 'Course created');
      setDialogOpen(false);
      fetchCourses();
    } catch {
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to delete');
        return;
      }
      toast.success('Course deleted');
      fetchCourses();
    } catch {
      toast.error('Failed to delete course');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCourses = deptFilter === 'all'
    ? courses
    : courses.filter((c) => c.departmentId === deptFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-bold text-gray-900">Courses</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Course
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-gray-400">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No courses yet</p>
            <p className="text-sm mt-1">Create courses under departments to start enrolling students</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-purple-100 shrink-0">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{course.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-cyan-50 text-cyan-700 border-cyan-200">
                          {course.department.name}
                        </Badge>
                        {course.duration && (
                          <span className="text-[10px] text-gray-400">{course.duration}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(course)}>
                      <Pencil className="h-3 w-3 text-gray-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id}
                    >
                      {deletingId === course.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-red-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-bold text-cyan-600">{formatCurrency(course.totalFee)}</p>
                  <p className="text-xs text-gray-500">{course._count.enrollments} enrolled</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Course' : 'New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course Name *</Label>
              <Input
                placeholder="e.g., SSC CGL Preparation"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={formDeptId} onValueChange={setFormDeptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  placeholder="e.g., 6 months"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Fee (₹) *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 15000"
                  value={formFee}
                  onChange={(e) => setFormFee(e.target.value)}
                  min={0}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional course description..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formDeptId || !formFee}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
