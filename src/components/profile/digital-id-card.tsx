'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Phone, Mail, RotateCcw, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalIdCardProps {
  student: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    avatar?: string | null;
    username?: string | null;
  };
}

export default function DigitalIdCard({ student }: DigitalIdCardProps) {
  const [flipped, setFlipped] = useState(false);

  // QR payload — encodes studentId for staff scanner
  const qrPayload = JSON.stringify({
    type: 'lamka_student_id',
    id: student.id,
    name: student.name,
    ts: Math.floor(Date.now() / 300000), // rotates every 5 minutes
  });

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className={cn(
          'relative w-full transition-all duration-500',
          'cursor-pointer select-none'
        )}
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((v) => !v)}
      >
        <div
          className="relative w-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.55s ease',
            minHeight: '220px',
          }}
        >
          {/* FRONT */}
          <Card
            className="absolute inset-0 rounded-2xl overflow-hidden border-0 shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-r from-cyan-700 to-slate-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-xs text-cyan-200 font-medium tracking-wide uppercase">Student ID</p>
                  <p className="text-white font-bold text-sm leading-tight">Lamka Coaching Center</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <QRCodeSVG
                  value={qrPayload}
                  size={56}
                  bgColor="transparent"
                  fgColor="white"
                  level="M"
                />
              </div>
            </div>

            {/* Body */}
            <CardContent className="pt-4 pb-4 bg-white space-y-1">
              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center shrink-0 text-cyan-700 font-bold text-lg overflow-hidden">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" />
                  ) : (
                    student.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-base truncate">{student.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{student.username || student.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-700">{student.phone}</p>
              </div>
              {student.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-600 truncate">{student.email}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs">
                  Active Student
                </Badge>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> Tap to flip
                </p>
              </div>
            </CardContent>
          </Card>

          {/* BACK */}
          <Card
            className="absolute inset-0 rounded-2xl overflow-hidden border-0 shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="bg-gradient-to-r from-slate-800 to-cyan-700 px-5 py-4">
              <p className="text-xs text-cyan-200 font-medium tracking-wide uppercase">Lamka Coaching Center</p>
              <p className="text-white font-bold text-sm">Identification Card (Reverse)</p>
            </div>

            <CardContent className="pt-4 pb-4 bg-white space-y-3">
              {student.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{student.address}</p>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 leading-relaxed">
                This ID card is issued by Lamka Coaching Center. If found, please return to the center or call us.
              </div>
              <div className="flex items-center gap-2 pt-1">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">ID: {student.id.slice(-8).toUpperCase()}</p>
              </div>
              <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                <RotateCcw className="h-3 w-3" /> Tap to flip back
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        Show the QR code to staff for instant check-in
      </p>
    </div>
  );
}
