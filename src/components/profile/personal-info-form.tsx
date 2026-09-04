'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Phone, Mail, MapPin, Loader2, Save, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalInfoFormProps {
  student: {
    id: string;
    name: string;
    username?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
  };
}

export function PersonalInfoForm({ student }: PersonalInfoFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(student.phone || '');
  const [email, setEmail] = useState(student.email || '');
  const [address, setAddress] = useState(student.address || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate phone
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setErrorMessage('Phone number is required');
      toast.error('Phone number cannot be empty');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Phone number must be at least 10 digits');
      toast.error('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    // Validate email if entered
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setErrorMessage('Please enter a valid email address');
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanPhone,
          email: cleanEmail || null,
          address: address.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Personal information updated successfully!');
      router.refresh();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const msg = err.message || 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Personal Information</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Keep your contact details up to date for SMS and notifications.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/70 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm animate-in fade-in">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Full Name (Read-only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Full Name
                </Label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="fullName"
                  value={student.name}
                  disabled
                  className="pl-10 bg-slate-50/80 border-slate-200 text-slate-600 font-medium cursor-not-allowed rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                To update your official registered name, please contact the center office.
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Phone Number <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[11px] text-indigo-600 font-medium">Used for SMS alerts</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  className="pl-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-400">Primary phone used for attendance and login.</p>
            </div>

            {/* Email Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-400">Used for payment receipts, notices, and communications.</p>
            </div>

            {/* Home Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Home / Permanent Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Vengnuam, New Lamka, Churachandpur"
                  className="pl-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow px-6 py-2.5 rounded-xl font-medium transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
