import PublicLayout from '@/components/public/public-layout';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Eye,
  Camera,
  Bell,
  Fingerprint,
  CreditCard,
  Trash2,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Lamka Coaching Center',
  description: 'Learn how Lamka Coaching Center collects, uses, protects, and manages your personal data across our website and mobile applications.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 4, 2026';

  return (
    <PublicLayout>
      <div className="bg-slate-50 dark:bg-gray-950 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Shield className="w-3.5 h-3.5" />
              Legal & Transparency
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Last Updated: <strong>{lastUpdated}</strong>
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-10">
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-600" />
                1. Introduction
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Welcome to <strong>Lamka Coaching Center</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting the privacy, security, and digital rights of our students, parents, and visitors. This Privacy Policy outlines how we collect, store, utilize, and protect your information across our website (<strong>lamkacoaching.in</strong>) and the official <strong>Lamka Coaching Android Application</strong>.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                By accessing our website, creating a student account, or using our mobile application, you agree to the collection and handling of your data as described in this policy.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-cyan-600" />
                2. Information We Collect
              </h2>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>We collect information necessary to provide educational coaching and study space services:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                      Student Identity & Contact Data
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Full name, phone number, email address, physical residential address, profile avatar, and student account username.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                      Academic & Enrollment Records
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enrolled courses, batch assignments, schedule timings, attendance records, digital ID pass details, and academic notifications.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                      Study Cabin & Facility Usage
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Desk / cabin bookings, reservation slots, check-in and check-out timestamps, and seat usage history.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                      Billing & Transaction History
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Payment amounts, payment modes (UPI / Cash / Card), receipt numbers, and transaction IDs. We do not store credit card numbers or banking PINs.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Device Permissions & Mobile App Usage */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-cyan-600" />
                3. Device Permissions (Android Mobile App)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                The Lamka Coaching Android Application requests only the minimal system permissions necessary for core educational and campus attendance functions:
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800">
                  <Camera className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Camera Permission (Optional)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Used exclusively to scan physical QR codes placed at study desks and classroom entrance checkpoints for instantaneous attendance check-in. The camera is never activated in the background or used to record photos/videos without user action.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Notifications Permission (Android 13+)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Used to deliver vital institutional announcements, class rescheduling notices, study cabin booking confirmations, fee reminders, and safety updates via Firebase Cloud Messaging (FCM). You can toggle notification permissions at any time in system settings.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800">
                  <Fingerprint className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Biometric Authentication (Fingerprint / Face Unlock)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Used strictly for 1-tap local device unlocking so students do not need to retype their password each time they open the app. <strong>Biometric data is processed exclusively on your device hardware</strong> via Android&apos;s native BiometricPrompt API. Your fingerprint or face templates are never transmitted to, viewed by, or stored on our servers.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Third-Party Service Providers */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                4. Third-Party Service Providers
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                We work with reputable, security-certified technology partners to operate our digital infrastructure:
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Razorpay:</strong> Encrypted payment gateway handling digital transactions, UPI, and debit cards in compliance with RBI standards and PCI-DSS requirements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Google Firebase:</strong> Secure device token routing for delivering push notification alerts to the Android mobile app.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>ImageKit & Vercel:</strong> High-performance content delivery and secure cloud infrastructure.</span>
                </li>
              </ul>
            </section>

            {/* 5. Data Security & Storage */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-cyan-600" />
                5. Data Security & Storage
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                We implement industry-standard cryptographic and architectural measures to safeguard student data:
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li>All data transferred between client applications and our servers is encrypted in transit using <strong>TLS 1.3 / HTTPS</strong>.</li>
                <li>All student passwords are cryptographically salted and hashed using <strong>bcrypt</strong> before storage; plaintext passwords are never stored.</li>
                <li>Sensitive mobile session tokens are stored in hardware-backed secure storage (Android Keystore / EncryptedSharedPreferences).</li>
                <li>Strict role-based access control (RBAC) ensures only authorized center administrators can inspect institutional student records.</li>
              </ul>
            </section>

            {/* 6. User Rights & Account Deletion */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-600" />
                6. Your Rights & Account Deletion
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                In strict compliance with Google Play Developer Policies and global data privacy standards, students possess complete ownership and control over their personal data:
              </p>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
                <span className="font-semibold text-rose-900 dark:text-rose-300 block text-sm">
                  Permanent Account & Data Deletion
                </span>
                <p className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
                  You can permanently delete your student account and purge all personal identification, attendance logs, enrollments, push tokens, and study space reservations at any time.
                </p>
                <div className="pt-2 flex flex-wrap gap-4">
                  <Link
                    href="/delete-account"
                    className="inline-flex items-center text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:text-rose-900 dark:hover:text-white"
                  >
                    Open Web Account Deletion Page &rarr;
                  </Link>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can also request deletion directly within the Android mobile app by visiting <strong>More &gt; Delete Account &amp; Data</strong>.
              </p>
            </section>

            {/* 7. Contact & Grievances */}
            <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-cyan-600" />
                7. Contact Us & Grievance Redressal
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                If you have questions, feedback, or grievance requests regarding this Privacy Policy or our data handling practices, please reach out to our administration:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span><strong>Lamka Coaching Center</strong>, Main Road, Churachandpur, Manipur - 795128, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Email: <a href="mailto:support@lamkacoaching.in" className="text-cyan-600 dark:text-cyan-400 underline">support@lamkacoaching.in</a></span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
