'use client';

import { AvatarUpload } from '@/components/profile/avatar-upload';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileHeroProps {
  student: {
    id: string;
    name: string;
    username?: string | null;
    avatar?: string | null;
    createdAt?: Date | string;
    enrollments?: any[];
    bookings?: any[];
  };
  onScrollToId?: () => void;
}

export function ProfileHero({ student, onScrollToId }: ProfileHeroProps) {
  const activeEnrollments = student.enrollments?.length || 0;
  const activeBookings = student.bookings?.length || 0;

  const joinedYear = student.createdAt 
    ? new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Active';

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200/80 bg-white">
      {/* Decorative Cover Gradient */}
      <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        {/* Subtle mesh overlay pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Glowing accents */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl" />

        <div className="absolute top-4 right-5 sm:top-6 sm:right-6 flex items-center gap-2">
          <Badge className="bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 backdrop-blur-md px-3 py-1 text-xs font-normal">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-cyan-300" />
            Lamka Coaching Portal
          </Badge>
        </div>
      </div>

      {/* Main Profile Info Header */}
      <div className="px-6 pb-6 pt-0 relative sm:flex sm:items-end sm:justify-between">
        <div className="sm:flex sm:items-end gap-5">
          {/* Avatar Upload Container (Overlapping banner) */}
          <div className="-mt-16 sm:-mt-20 mb-3 sm:mb-0 relative inline-block">
            <div className="p-1 rounded-full bg-white shadow-xl ring-4 ring-white/60">
              <AvatarUpload studentId={student.id} initialAvatar={student.avatar} />
            </div>
          </div>

          {/* Student Identifiers */}
          <div className="space-y-1 sm:pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {student.name}
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium text-xs px-2.5 py-0.5">
                <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
                Active Student
              </Badge>
            </div>

            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <span>@{student.username || 'student'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400">ID: {student.id.slice(0, 8)}...</span>
            </p>
          </div>
        </div>

        {/* Quick Badges / Pass Shortcut */}
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2 sm:pb-2">
          {onScrollToId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onScrollToId}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50/80 rounded-xl text-xs font-semibold shadow-xs"
            >
              <QrCode className="h-3.5 w-3.5 mr-1.5" />
              Digital ID Pass
            </Button>
          )}

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Member since {joinedYear}</span>
          </div>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-slate-100 divide-x divide-slate-100 bg-slate-50/60 text-center py-3">
        <div className="px-4">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Enrolled Courses
          </p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">
            {activeEnrollments} {activeEnrollments === 1 ? 'Course' : 'Courses'}
          </p>
        </div>

        <div className="px-4">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-cyan-600" /> Study Cabin
          </p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">
            {activeBookings > 0 ? `${activeBookings} Active` : 'None Active'}
          </p>
        </div>

        <div className="hidden sm:block px-4">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> Member Since
          </p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{joinedYear}</p>
        </div>
      </div>
    </div>
  );
}
