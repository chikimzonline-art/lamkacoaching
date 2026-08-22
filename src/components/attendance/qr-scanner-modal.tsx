'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, Flashlight, X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
  title?: string;
  hint?: string;
}

export default function QrScannerModal({
  open,
  onClose,
  onScan,
  title = 'Scan QR Code',
  hint = 'Point your camera at a QR code',
}: QrScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');

  const handleStartScan = async () => {
    setError('');
    setScanning(true);
    try {
      const { startQrScan } = await import('@/lib/capacitor/qr-scanner');
      const result = await startQrScan();
      if (result) {
        const { hapticFeedback } = await import('@/lib/capacitor/haptics');
        await hapticFeedback.heavy();
        onScan(result.rawValue);
        onClose();
      } else {
        setError('No QR code detected. Try again.');
      }
    } catch (err) {
      setError('Camera unavailable. Use manual entry below.');
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      setError('Please enter a code.');
      return;
    }
    onScan(manualCode.trim());
    setManualCode('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Scanner viewfinder area */}
          <div
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-950 h-52 overflow-hidden transition-colors',
              scanning ? 'border-cyan-500' : 'border-gray-700'
            )}
          >
            {/* Animated scan beam */}
            {scanning && (
              <div className="absolute inset-x-8 h-0.5 bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.7)] animate-scan-beam" />
            )}

            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br" />

            <ScanLine className={cn('h-12 w-12', scanning ? 'text-cyan-400 animate-pulse' : 'text-gray-600')} />
            <p className="text-sm text-gray-400 mt-2 px-6 text-center">
              {scanning ? 'Scanning…' : hint}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={handleStartScan}
              disabled={scanning}
            >
              <ScanLine className="h-4 w-4 mr-2" />
              {scanning ? 'Scanning…' : 'Scan QR Code'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowManual((v) => !v)}
              title="Enter code manually"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>

          {/* Manual entry fallback */}
          {showManual && (
            <div className="flex gap-2">
              <Input
                placeholder="Paste or type code…"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
                className="flex-1"
              />
              <Button onClick={handleManualSubmit} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Submit
              </Button>
            </div>
          )}

          <Button variant="ghost" className="w-full text-gray-500" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
