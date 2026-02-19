import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600 mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
