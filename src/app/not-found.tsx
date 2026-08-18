import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="mb-2 text-6xl font-extrabold text-gray-900 tracking-tight">404</h1>
      <h2 className="mb-6 text-2xl font-bold text-gray-700">Page Not Found</h2>
      <p className="mb-8 max-w-md text-gray-500">
        We couldn't find the page you were looking for. It might have been moved, deleted, or never existed.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Return to Home
      </Link>
    </div>
  );
}
