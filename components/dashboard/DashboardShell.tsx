'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Video } from 'lucide-react';
import { DashboardNav } from './DashboardNav';

interface DashboardShellProps {
  children: React.ReactNode;
  firstName?: string;
}

export function DashboardShell({ children, firstName = 'there' }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-gray-900/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold text-white">ReplySequence</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                Hey, <span className="font-medium text-white">{firstName}</span>!
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <DashboardNav />

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
