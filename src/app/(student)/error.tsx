'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Student Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl border border-gray-100">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Oops! Something went wrong</h2>
        <p className="mb-8 text-gray-500">
          We encountered an issue loading this section of your dashboard. Our team has been notified automatically.
        </p>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0 justify-center">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
