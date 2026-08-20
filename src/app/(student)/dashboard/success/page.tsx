import { requireStudent } from "@/lib/student-auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CheckCircle2, Building2, BookOpen } from "lucide-react";
import { ReceiptActions } from "./receipt-actions";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string; payment_id?: string }>;
}) {
  const { student } = await requireStudent();

  const { type, id: itemId, payment_id: paymentId } = await searchParams;

  if (!type || !itemId) {
    redirect("/dashboard");
  }

  // Fetch official business details configured via Admin Dashboard
  const settings = await db.setting.findMany({
    where: {
      key: { in: ['business_name', 'business_address', 'business_phone', 'business_email'] }
    }
  });

  const getSetting = (key: string, def: string) => settings.find(s => s.key === key)?.value || def;

  const businessName = getSetting('business_name', 'Lamka Coaching Center');
  const businessAddress = getSetting('business_address', '2nd Floor, Synod House, Hill Town, Churachandpur, Manipur - 795128');
  const businessPhone = getSetting('business_phone', '+91 69091 62980');
  const businessEmail = getSetting('business_email', 'lamkacoaching@gmail.com');

  let transactionDetails: {
    title: string;
    icon: React.ReactNode;
    itemType: string;
    itemName: string;
    amount: number;
    date: string;
    backLink: string;
    backText: string;
  } | null = null;

  if (type === "cabin") {
    const booking = await db.booking.findFirst({
      where: {
        cabinId: itemId,
        studentId: student.id,
      },
      include: {
        cabin: true,
        payments: {
          orderBy: { receivedAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!booking) {
      redirect("/dashboard/cabins");
    }

    const paymentDate = booking.payments[0]?.receivedAt || booking.updatedAt;

    transactionDetails = {
      title: "Cabin Booking Successful",
      icon: <Building2 className="h-6 w-6 text-emerald-600" />,
      itemType: "Cabin Subscription",
      itemName: `Cabin ${booking.cabin.cabinNum} (Floor ${booking.cabin.floor})`,
      amount: booking.totalAmount, // Amount is in paise, we'll format it
      date: new Date(paymentDate).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      backLink: "/dashboard/my-learning", // Or whatever the active bookings page is
      backText: "My Bookings"
    };

  } else if (type === "course") {
    const enrollment = await db.enrollment.findFirst({
      where: {
        courseId: itemId,
        studentId: student.id,
      },
      include: {
        course: true,
        payments: {
          orderBy: { receivedAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!enrollment) {
      redirect("/dashboard/courses");
    }

    const paymentDate = enrollment.payments[0]?.receivedAt || enrollment.updatedAt;
    
    // For courses, amount could be partial or full. We'll show what they paid in this specific transaction if available, else totalFee
    const amountPaid = enrollment.payments[0]?.amount || enrollment.totalFee;

    transactionDetails = {
      title: "Course Enrollment Successful",
      icon: <BookOpen className="h-6 w-6 text-emerald-600" />,
      itemType: "Course Access",
      itemName: enrollment.course.name,
      amount: amountPaid,
      date: new Date(paymentDate).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      backLink: "/dashboard/my-learning",
      backText: "My Learning"
    };
  } else {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8 print:py-0 print:max-w-full print:w-full">
      {/* Receipt Card */}
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 print:shadow-none print:border-none print:rounded-none">
        
        {/* Header / Success Banner */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 sm:p-8 text-center print:from-white print:to-white print:border-b print:border-gray-200">
          <div className="inline-flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 print:bg-transparent print:text-emerald-600 mb-4 sm:mb-6">
            <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white print:text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white print:text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-emerald-100 print:text-gray-500 font-medium text-sm sm:text-lg">
            Thank you for your purchase. Your transaction is complete.
          </p>
        </div>

        {/* Receipt Details */}
        <div className="p-6 sm:p-12">
          
          <div className="flex items-center gap-3.5 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl shrink-0">
              {transactionDetails?.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {transactionDetails?.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {businessName}
              </p>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between pb-4 border-b border-gray-50 dark:border-gray-800 border-dashed">
              <span className="text-gray-500 dark:text-gray-400 font-medium mb-1 sm:mb-0 text-xs sm:text-sm">Item</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold text-left sm:text-right text-sm sm:text-base">
                {transactionDetails?.itemName}
                <span className="block text-xs text-gray-400 font-normal mt-0.5">{transactionDetails?.itemType}</span>
              </span>
            </div>

            <div className="flex justify-between pb-4 border-b border-gray-50 dark:border-gray-800 border-dashed">
              <span className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">Date</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold text-right text-xs sm:text-sm">
                {transactionDetails?.date}
              </span>
            </div>

            {paymentId && (
              <div className="flex justify-between pb-4 border-b border-gray-50 dark:border-gray-800 border-dashed">
                <span className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">Transaction ID</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono text-xs sm:text-sm font-semibold">
                  {paymentId}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-end pt-4">
              <span className="text-gray-700 dark:text-gray-300 font-bold text-base sm:text-lg">Amount Paid</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(transactionDetails?.amount || 0)}
              </span>
            </div>
          </div>

          <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 print:block space-y-1">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{businessName}</p>
            <p className="text-slate-600">{businessAddress}</p>
            <p className="text-slate-600">{businessEmail} • {businessPhone}</p>
            <p className="text-[11px] text-slate-400 pt-3">This is a computer-generated receipt and does not require a physical signature.</p>
          </div>

        </div>
      </div>

      {/* Action Buttons (Client Component with Confetti) */}
      {transactionDetails && (
        <ReceiptActions backLink={transactionDetails.backLink} backText={transactionDetails.backText} />
      )}
      
    </div>
  );
}
