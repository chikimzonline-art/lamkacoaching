'use client';

import { useState } from 'react';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (confirmText !== 'DELETE') {
      setErrorMessage('Please type DELETE in capital letters to confirm.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      setIsDeleted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <div className="bg-slate-50 dark:bg-gray-950 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Trash2 className="w-3.5 h-3.5" />
              Account & Data Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Delete Account & Associated Data
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Transparency and complete user control over your personal data at Lamka Coaching Center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Disclosures & Mobile App Steps */}
            <div className="md:col-span-7 space-y-6">
              {/* How to delete via mobile app */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold text-lg mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  Delete via the Mobile App (Recommended)
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  If you currently have the Lamka Coaching Android App installed, you can delete your account directly without needing this web form:
                </p>
                <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center">1</span>
                    <span>Open the <strong>Lamka Coaching</strong> App on your Android device.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center">2</span>
                    <span>Navigate to the <strong>More / Profile</strong> tab in the bottom bar.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center">3</span>
                    <span>Scroll down and tap <strong>Delete Account & Data</strong>.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center">4</span>
                    <span>Confirm by typing your password and tap <strong>Proceed to Delete</strong>.</span>
                  </li>
                </ol>
              </div>

              {/* Data Deletion Details */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold text-lg">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  What Data is Permanently Deleted
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Upon submitting an account deletion request, our systems immediately and permanently purge:
                </p>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Personal Profile: Full name, phone number, email address, physical address, and avatar.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Authentication Data: Passwords, session tokens, and local biometric vault keys.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Push Notifications: Firebase Cloud Messaging (FCM) device registration tokens and notification history.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Academic & Center Records: Course enrollments, batch logs, study space cabin bookings, and attendance logs.</span>
                  </li>
                </ul>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Data Retention Policy:</strong> Statutory financial records (such as completed payment receipt numbers, transaction IDs, and dates) are retained in an anonymized format strictly for the legally mandated tax and financial audit period, after which they are expunged.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Web Deletion Form */}
            <div className="md:col-span-5">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg mb-2">
                  <Lock className="w-5 h-5 text-rose-600" />
                  Web Deletion Request
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Use this form if you have already uninstalled the app or prefer to request deletion via the web.
                </p>

                {isDeleted ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Account Successfully Deleted
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Your student profile, login credentials, and associated personal records have been permanently expunged from our servers.
                    </p>
                    <div className="pt-4">
                      <Button asChild variant="outline" className="w-full">
                        <a href="/">Return to Home</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDelete} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="identifier" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Phone Number / Username / Email
                      </Label>
                      <Input
                        id="identifier"
                        type="text"
                        placeholder="e.g. 9876543210 or username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Your Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="text-sm"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs space-y-2">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Irreversible Action
                      </div>
                      <p className="leading-relaxed">
                        To prevent accidental deletion, type <strong>DELETE</strong> below to confirm.
                      </p>
                      <Input
                        type="text"
                        placeholder="Type DELETE"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="bg-white dark:bg-gray-900 text-sm font-mono uppercase"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || confirmText !== 'DELETE'}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium mt-2"
                    >
                      {isSubmitting ? (
                        'Verifying & Deleting...'
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Permanently Delete Account
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
                      Need help? Contact support at{' '}
                      <a href="mailto:support@lamkacoaching.in" className="underline hover:text-slate-600 dark:hover:text-slate-300">
                        support@lamkacoaching.in
                      </a>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
