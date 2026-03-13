'use client';

import { DashboardToolbar } from './DashboardToolbar';
import { CommandPalette } from './CommandPalette';
import { MeetingChat } from './MeetingChat';

interface DashboardShellProps {
  children: React.ReactNode;
  firstName?: string;
  pendingDrafts?: number;
  userEmail?: string;
}

export function DashboardShell({ children, firstName = 'there', pendingDrafts = 0, userEmail = '' }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#0c0e14] light:bg-gray-50 relative overflow-hidden">
      {/* Ambient gradient mesh — subtle color field behind content */}
      <div className="pointer-events-none fixed inset-0 light:hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[50%] rounded-full bg-indigo-600/[0.07] blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[35%] h-[40%] rounded-full bg-violet-600/[0.05] blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[35%] rounded-full bg-blue-600/[0.04] blur-[100px]" />
      </div>

      {/* Page Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {children}
      </main>

      {/* Floating Dashboard Toolbar */}
      <DashboardToolbar firstName={firstName} pendingDrafts={pendingDrafts} userEmail={userEmail} />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Floating AI Chat */}
      <MeetingChat />
    </div>
  );
}
