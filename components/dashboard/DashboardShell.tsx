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
    <div className="min-h-screen bg-transparent light:bg-transparent">
      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
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
