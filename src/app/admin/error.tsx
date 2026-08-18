'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Admin Panel Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg border border-gray-100">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Admin System Error</h2>
        <p className="mb-6 text-gray-600">
          An unexpected error occurred in the administrative panel. 
          {error.message && <span className="block mt-2 text-sm text-gray-500">{error.message}</span>}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/admin/dashboard"
            className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Admin Home
          </Link>
        </div>
      </div>
    </div>
  );
}
