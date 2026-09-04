'use client';

import { Phone, Mail, MapPin, ShieldCheck, HelpCircle, Building2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfileSummaryCardProps {
  student: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  };
}

export function ProfileSummaryCard({ student }: ProfileSummaryCardProps) {
  return (
    <div className="space-y-5">
      {/* Contact Summary Card */}
      <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Contact Summary</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Registered contact details on file
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-3.5 text-sm">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-3 text-slate-700 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="truncate">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Phone</p>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{student.phone}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 shrink-0">
              Verified
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-3 text-slate-700 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="truncate">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Email</p>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                  {student.email || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-slate-700">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Address</p>
              <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                {student.address || 'Not provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Help / Legal Name Notice */}
      <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 rounded-2xl shadow-xs">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Need to update your official name?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official student names must match government identity documents. To request a change, please contact the Lamka Coaching administration desk.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
