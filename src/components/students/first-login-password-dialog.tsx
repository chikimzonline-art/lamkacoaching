'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateSecurePassword } from '@/lib/email';

export function FirstLoginPasswordDialog() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only trigger for authenticated student sessions
    const user = session?.user as any;
    const userId = user?.id;
    const role = user?.role;

    if (userId && role === 'student') {
      const storageKey = `lkc_pwd_prompt_${userId}`;
      const hasDismissed = localStorage.getItem(storageKey);
      if (!hasDismissed) {
        // Short delay for smooth entrance
        const timer = setTimeout(() => {
          setOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [session]);

  const handleDismiss = () => {
    const user = session?.user as any;
    if (user?.id) {
      localStorage.setItem(`lkc_pwd_prompt_${user.id}`, 'dismissed');
    }
    setOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const user = session?.user as any;
    setSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: user?.id,
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Your permanent password has been set successfully!');
      handleDismiss();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleDismiss()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center mb-2">
            <ShieldCheck className="h-5 w-5 text-cyan-700" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Set Your Permanent Password
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Welcome to Lamka Coaching Center! You can now choose a personal, easy-to-remember password for your student portal account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3.5 py-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700">New Password</Label>
              <button
                type="button"
                onClick={() => {
                  const gen = generateSecurePassword();
                  setPassword(gen);
                  setConfirmPassword(gen);
                }}
                className="text-[11px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"
              >
                <Key className="h-3 w-3" /> Auto-generate
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password (min. 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-9 h-9 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Confirm Password</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            <em>You can also change your password anytime later from your profile settings.</em>
          </p>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100 flex-col-reverse sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Skip / Keep Current
            </Button>
            <Button
              type="submit"
              disabled={submitting || !password.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-9"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                'Save Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
