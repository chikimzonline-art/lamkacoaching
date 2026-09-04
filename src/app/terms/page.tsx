import PublicLayout from '@/components/public/public-layout';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  DoorOpen,
  CreditCard,
  Ban,
  ShieldCheck,
  Mail,
  MapPin,
  Scale,
} from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Lamka Coaching Center',
  description: 'Read the Terms of Service governing the use of Lamka Coaching Center educational facilities, study space cabins, website, and mobile app.',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'September 4, 2026';

  return (
    <PublicLayout>
      <div className="bg-slate-50 dark:bg-gray-950 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Scale className="w-3.5 h-3.5" />
              Terms & Conditions
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Effective Date: <strong>{lastUpdated}</strong>
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-10">
            {/* 1. Acceptance */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-600" />
                1. Acceptance of Terms
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a binding legal agreement between you (&ldquo;Student,&rdquo; &ldquo;User,&rdquo; or &ldquo;You&rdquo;) and <strong>Lamka Coaching Center</strong> (&ldquo;Center,&rdquo; &ldquo;We,&rdquo; or &ldquo;Us&rdquo;), governing your use of our physical facilities, website (<strong>lamkacoaching.in</strong>), and the official <strong>Lamka Coaching Android Application</strong>.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                By creating a student account, enrolling in our coaching courses, booking a study space cabin, or downloading our mobile app, you confirm that you have read, understood, and agreed to be bound by these Terms.
              </p>
            </section>

            {/* 2. Student Accounts */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-600" />
                2. Student Account Registration &amp; Security
              </h2>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete personal information (including phone number and name) during registration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Single Account &amp; Non-Transferability:</strong> Accounts are assigned exclusively to individual students. You may not share, sell, or transfer your login credentials or digital student pass to any other individual.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your account password and biometric unlock settings on your mobile device.</span>
                </li>
              </ul>
            </section>

            {/* 3. Coaching Courses */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-cyan-600" />
                3. Coaching Courses &amp; Academic Policies
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Enrollment in classroom batches, computer training courses, and specialized test preparation is subject to seat availability and prerequisites:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-white block text-sm">Attendance &amp; Schedule</span>
                  <span>Students must adhere to designated batch timings. Routine attendance is tracked via QR code or digital ID pass verification.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-white block text-sm">Study Materials &amp; IP</span>
                  <span>Course handouts, digital study resources, tests, and curricula provided by Lamka Coaching Center are copyrighted and reserved for registered students only.</span>
                </div>
              </div>
            </section>

            {/* 4. Study Space & Cabin Bookings */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <DoorOpen className="w-5 h-5 text-cyan-600" />
                4. Study Space &amp; Cabin Reservation Rules
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Our quiet study cabins provide focused environments for serious aspirants. All cabin reservations are governed by our facility guidelines:
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Quiet Zone Requirement:</strong> Study cabins are strictly designated as quiet zones. Loud discussions, group chats, or mobile phone calls are prohibited inside the study cabin area.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Slot Validity:</strong> Reserved cabins are valid only for the booked timeframe and assigned floor/cabin number.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Check-in Requirement:</strong> Students must scan the assigned QR code upon arrival to confirm check-in and maintain active occupancy.</span>
                </li>
              </ul>
            </section>

            {/* 5. Fees & Payments */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                5. Fees, Payments &amp; Invoices
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                All course tuition fees and study cabin reservation fees are published on our platform in Indian Rupees (INR):
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li>Payments can be made via Razorpay digital gateway (UPI / Cards / Net Banking) or verified center cash desks.</li>
                <li>Digital receipts and transaction records are generated immediately upon successful confirmation and made accessible in the student mobile app and website portal.</li>
                <li>Fees paid for completed or active coaching courses are generally non-refundable once batch sessions commence.</li>
              </ul>
            </section>

            {/* 6. Prohibited Conduct */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Ban className="w-5 h-5 text-rose-600" />
                6. Prohibited Conduct &amp; Disciplinary Action
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <p>The following actions will result in immediate suspension of facility access and account termination:</p>
                <ul className="space-y-1 text-xs list-disc list-inside text-slate-600 dark:text-slate-400">
                  <li>Damaging center property, electronic fixtures, Wi-Fi hardware, or cabin furnishings.</li>
                  <li>Harassment, bullying, or disruptive behavior toward fellow students, faculty, or staff.</li>
                  <li>Attempting unauthorized access, reverse-engineering, or tampering with the mobile app or backend APIs.</li>
                  <li>Fraudulent payment chargebacks or providing falsified admission documents.</li>
                </ul>
              </div>
            </section>

            {/* 7. Account Termination */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-cyan-600" />
                7. Account Deletion &amp; Termination
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You may choose to delete your account and personal records at any time directly through the mobile app (<strong>More &gt; Delete Account &amp; Data</strong>) or via our dedicated web portal at <Link href="/delete-account" className="text-cyan-600 dark:text-cyan-400 underline font-medium">lamkacoaching.in/delete-account</Link>. Deleting your account terminates all active enrollments and cabin bookings.
              </p>
            </section>

            {/* 8. Governing Law */}
            <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-cyan-600" />
                8. Governing Law &amp; Jurisdiction
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising from these Terms or your use of the Center&apos;s facilities shall be subject to the exclusive jurisdiction of the competent courts in <strong>Churachandpur, Manipur, India</strong>.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 mt-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span><strong>Lamka Coaching Center</strong>, Main Road, Churachandpur, Manipur - 795128</span>
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
