'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanLine, CheckCircle2, XCircle, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StaffScanResult {
  studentName: string;
  studentPhone: string;
  cabinNum?: number;
  message: string;
}

interface StaffScannerDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function StaffScannerDialog({ open, onClose }: StaffScannerDialogProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<StaffScanResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    setError('');
    setResult(null);
    setScanning(true);

    try {
      const { startQrScan } = await import('@/lib/capacitor/qr-scanner');
      const scanned = await startQrScan();

      if (!scanned) {
        setError('No QR code detected.');
        setScanning(false);
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(scanned.rawValue);
      } catch {
        setError('Invalid QR code format.');
        setScanning(false);
        return;
      }

      if (payload.type !== 'lamka_student_id') {
        setError('This QR code is not a Lamka Coaching student ID.');
        setScanning(false);
        return;
      }

      // Call the existing attendance check-in API
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          studentId: payload.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Check-in failed.');
        setScanning(false);
        return;
      }

      const { hapticFeedback } = await import('@/lib/capacitor/haptics');
      await hapticFeedback.heavy();

      setResult({
        studentName: payload.name || data.attendance?.booking?.student?.name || 'Student',
        studentPhone: data.attendance?.booking?.student?.phone || '',
        cabinNum: data.attendance?.booking?.cabin?.cabinNum,
        message: `Checked in at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      });
      toast.success(`${payload.name || 'Student'} checked in successfully!`);
    } catch (err) {
      setError('Scanner error. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Scan Student ID</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success result */}
          {result && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Check-In Successful!
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium">{result.studentName}</p>
              </div>
              {result.cabinNum && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">Cabin #{result.cabinNum}</p>
                </div>
              )}
              <p className="text-xs text-emerald-600">{result.message}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-red-700 text-sm">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Scanner viewfinder placeholder */}
          {!result && (
            <div className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-950 h-44 overflow-hidden',
              scanning ? 'border-cyan-500' : 'border-gray-700'
            )}>
              {scanning && (
                <div className="absolute inset-x-8 h-0.5 bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.7)] animate-scan-beam" />
              )}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-cyan-400 rounded-br" />
              <ScanLine className={cn('h-10 w-10', scanning ? 'text-cyan-400 animate-pulse' : 'text-gray-600')} />
              <p className="text-xs text-gray-400 mt-2 text-center px-4">
                {scanning ? 'Scanning student ID…' : 'Point camera at student\'s digital ID badge'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {result ? (
              <>
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => { setResult(null); setError(''); }}>
                  <ScanLine className="h-4 w-4 mr-2" /> Scan Another
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleClose}>Done</Button>
              </>
            ) : (
              <>
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handleScan} disabled={scanning}>
                  <ScanLine className="h-4 w-4 mr-2" />
                  {scanning ? 'Scanning…' : 'Scan Student ID'}
                </Button>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
