'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UserButton } from '@clerk/nextjs';
import { Video } from 'lucide-react';
import { DashboardNav } from './DashboardNav';
import { MobileBottomNav } from './MobileBottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { CommandPalette } from './CommandPalette';

const DashboardMarginBubbles = dynamic(() => import('@/components/DashboardMarginBubbles'), { ssr: false });

interface DashboardShellProps {
  children: React.ReactNode;
  firstName?: string;
  pendingDrafts?: number;
}

export function DashboardShell({ children, firstName = 'there', pendingDrafts = 0 }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-transparent light:bg-transparent">
      <DashboardMarginBubbles />
      {/* Header */}
      <header className="bg-gray-900/70 light:bg-white/80 backdrop-blur-xl border-b border-white/10 light:border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold text-white light:text-gray-900">ReplySequence</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="hidden sm:inline text-sm text-gray-300 light:text-gray-600">
                Hey, <span className="font-medium text-white light:text-gray-900">{firstName}</span>!
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Desktop Navigation Tabs */}
        <DashboardNav pendingDrafts={pendingDrafts} />

        {/* Page Content */}
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav pendingDrafts={pendingDrafts} />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />
    </div>
  );
}
