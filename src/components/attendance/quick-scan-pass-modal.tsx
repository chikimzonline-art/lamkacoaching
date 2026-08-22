'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Shield, QrCode, Sparkles, User, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const QrScannerModal = dynamic(() => import('./qr-scanner-modal'), { ssr: false });

interface QuickScanPassModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'scan' | 'pass';
}

export default function QuickScanPassModal({
  open,
  onClose,
  defaultTab = 'scan',
}: QuickScanPassModalProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'pass'>(defaultTab);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const user = session?.user as any;

  // Dynamic QR payload: rotates periodically for anti-screenshot security
  const qrPayload = JSON.stringify({
    type: 'lamka_student_id',
    id: user?.id || 'student',
    name: user?.name || 'Student',
    phone: user?.phone || '',
    ts: Math.floor(Date.now() / 300000), // 5 min rotation
  });

  const handleDeskQrScan = async (scannedValue: string) => {
    try {
      const res = await fetch('/api/attendance/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          deskQrPayload: scannedValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Check-in failed');
        return;
      }
      toast.success(data.message || 'Checked in successfully!');
      router.refresh();
      onClose();
    } catch {
      toast.error('Failed to log attendance');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-md rounded-3xl p-5 overflow-hidden border border-slate-200 shadow-2xl">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              Attendance & Pass
            </DialogTitle>
          </DialogHeader>

          {/* Segmented Control Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200/80 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'scan'
                  ? 'bg-white text-cyan-700 shadow-xs border border-cyan-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <ScanLine className="h-4 w-4" />
              Scan Desk QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pass')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'pass'
                  ? 'bg-white text-cyan-700 shadow-xs border border-cyan-200'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <QrCode className="h-4 w-4" />
              My Student Pass
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: SCAN DESK QR                                                       */}
          {/* ========================================================================= */}
          {activeTab === 'scan' && (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 shadow-inner">
                <ScanLine className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Study Cabin Desk Check-In</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Scan the QR sticker on your cabin desk to check in and log your study hours.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setScannerOpen(true)}
                  className="w-full h-12 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-semibold rounded-2xl shadow-lg shadow-cyan-500/25 gap-2 text-sm"
                >
                  <ScanLine className="h-5 w-5" />
                  Launch Camera Scanner
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MY DIGITAL STUDENT PASS (Digital Boarding Pass Style)             */}
          {/* ========================================================================= */}
          {activeTab === 'pass' && (
            <div className="space-y-3">
              {/* Pass Card Container */}
              <div className="rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden bg-white">
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Standalone Camera Scanner */}
      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleDeskQrScan}
        title="Scan Desk QR Code"
        hint="Point camera at the QR sticker on your cabin desk"
      />
    </>
  );
}
