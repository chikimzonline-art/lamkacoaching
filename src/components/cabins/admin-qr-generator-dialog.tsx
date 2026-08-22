'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X } from 'lucide-react';
import { toast } from 'sonner';

interface Cabin {
  id: string;
  floor: number;
  cabinNum: number;
}

interface AdminQrGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  cabins: Cabin[];
}

function generateDeskQrPayload(cabin: Cabin): string {
  return JSON.stringify({
    type: 'lamka_cabin_desk',
    cabinId: cabin.id,
    cabinNum: cabin.cabinNum,
    floor: cabin.floor,
  });
}

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${floor}${suffixes[floor] || 'th'} Floor`;
}

export default function AdminQrGeneratorDialog({ open, onClose, cabins }: AdminQrGeneratorDialogProps) {
  const [saving, setSaving] = useState(false);

  const floors = [...new Set(cabins.map((c) => c.floor))].sort((a, b) => a - b);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setSaving(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = 210;
      const margin = 15;
      const cols = 3;
      const cellW = (pageW - margin * 2) / cols;
      const cellH = 70;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Lamka Coaching Center — Cabin Desk QR Codes', pageW / 2, 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Print and laminate. Stick on each cabin desk.', pageW / 2, 18, { align: 'center' });

      let col = 0;
      let row = 0;
      let page = 1;

      for (const cabin of cabins) {
        const x = margin + col * cellW;
        const y = 25 + row * cellH;

        if (y + cellH > 280) {
          doc.addPage();
          row = 0;
          col = 0;
          page++;
        }

        // Draw cell border
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x + 2, y + 2, cellW - 4, cellH - 4, 3, 3, 'S');

        // Cabin label
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Cabin #${cabin.cabinNum}`, x + cellW / 2, y + 10, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(formatFloorLabel(cabin.floor), x + cellW / 2, y + 16, { align: 'center' });

        // QR placeholder note (actual QR would need canvas2pdf)
        doc.setFontSize(7);
        doc.text('[ QR Code ]', x + cellW / 2, y + 38, { align: 'center' });
        doc.text('Scan to Check In', x + cellW / 2, y + 58, { align: 'center' });
        doc.text('Lamka Coaching Center', x + cellW / 2, y + 63, { align: 'center' });

        col++;
        if (col >= cols) {
          col = 0;
          row++;
        }
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Save to device (native) or browser download (web)
      const { savePdfToDevice } = await import('@/lib/capacitor/file-manager');
      const saved = await savePdfToDevice('Lamka_Cabin_QR_Codes.pdf', pdfBase64);

      if (saved) {
        toast.success('QR code sheet saved to Downloads!');
      } else {
        toast.error('Failed to save. Try again.');
      }
    } catch (err) {
      console.error('[AdminQrGenerator] PDF generation failed', err);
      toast.error('Failed to generate PDF');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Cabin Desk QR Codes</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Print these QR codes and laminate them to stick on each cabin desk. Students scan them to self check-in.
          </p>

          <div className="flex gap-2">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print All
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={saving}>
              <Download className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save as PDF'}
            </Button>
            <Button variant="ghost" className="ml-auto" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* QR Code grid — printable */}
          {floors.map((floor) => (
            <div key={floor}>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">{formatFloorLabel(floor)}</h3>
              <div className="grid grid-cols-3 gap-4 print:grid-cols-3">
                {cabins
                  .filter((c) => c.floor === floor)
                  .map((cabin) => (
                    <div
                      key={cabin.id}
                      className="border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                    >
                      <p className="font-bold text-sm text-gray-900">Cabin #{cabin.cabinNum}</p>
                      <p className="text-xs text-gray-500">{formatFloorLabel(cabin.floor)}</p>
                      <QRCodeSVG
                        value={generateDeskQrPayload(cabin)}
                        size={96}
                        level="M"
                        includeMargin
                      />
                      <p className="text-[10px] text-gray-400">Scan to Check In</p>
                      <p className="text-[10px] font-semibold text-cyan-700">Lamka Coaching Center</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
