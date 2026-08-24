'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

interface QuickScanPassModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickScanPassModal({
  open,
  onClose,
}: QuickScanPassModalProps) {
  const { data: session } = useSession();
  const user = session?.user as any;

  // Dynamic QR payload: rotates periodically for anti-screenshot security
  const qrPayload = JSON.stringify({
    type: 'lamka_student_id',
    id: user?.id || 'student',
    name: user?.name || 'Student',
    phone: user?.phone || '',
    ts: Math.floor(Date.now() / 300000), // 5 min rotation
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-3xl p-5 overflow-hidden border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-center text-lg font-bold text-slate-900">
            Digital Student Pass
          </DialogTitle>
        </DialogHeader>

        {/* Pass Card Container */}
        <div className="rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden bg-white mt-2">
          {/* Pass Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-sm overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'Student'} className="h-full w-full object-cover" />
                ) : (
                  (user?.name || 'S').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Student'}</p>
                <p className="text-[11px] text-cyan-200/80">
                  {user?.phone || `@${user?.username || 'student'}`}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5">
              Active Student
            </Badge>
          </div>

          {/* Hero Centered Large QR Code */}
          <div className="p-5 flex flex-col items-center justify-center bg-slate-50/50">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200/80 shadow-md shadow-slate-200/50 flex items-center justify-center">
              <QRCodeSVG
                value={qrPayload}
                size={185}
                level="H"
                bgColor="#ffffff"
                fgColor="#0f172a"
                includeMargin={false}
              />
            </div>

            {/* Security & Instruction Indicator */}
            <div className="mt-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dynamic Live Pass • Show to Reception Staff</span>
            </div>
          </div>

          {/* Pass Footer Info */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[11px]">ID: {(user?.id || 'STU').slice(-8).toUpperCase()}</span>
            <Link
              href="/dashboard/profile"
              onClick={onClose}
              className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-0.5 text-[11px]"
            >
              Full Profile <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
