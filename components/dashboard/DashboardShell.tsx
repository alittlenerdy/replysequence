'use client';

import { DashboardToolbar } from './DashboardToolbar';
import { CommandPalette } from './CommandPalette';
import { MeetingChat } from './MeetingChat';
import { UserAvatar } from './UserAvatar';

interface DashboardShellProps {
  children: React.ReactNode;
  firstName?: string;
  pendingDrafts?: number;
  userEmail?: string;
}

export function DashboardShell({ children, firstName = 'there', pendingDrafts = 0, userEmail = '' }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#060B18] light:bg-[#F1F5F9] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 light:hidden" aria-hidden="true">
        <div className="absolute top-[-5%] left-[-2%] w-[30%] h-[30%] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(91, 108, 255, 0.10) 0%, transparent 70%)' }} />
        <div className="absolute top-[5%] right-[-3%] w-[25%] h-[25%] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(91, 108, 255, 0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(122, 139, 255, 0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Top-right user profile */}
      <div className="fixed top-4 right-4 sm:right-6 z-50 flex items-center gap-3">
        <span className="hidden sm:inline text-xs text-gray-400 light:text-gray-500">
          {firstName !== 'there' ? firstName : ''}
        </span>
        <UserAvatar />
      </div>

      {/* Page Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {children}
      </main>

      {/* Floating Dashboard Toolbar — navigation only */}
      <DashboardToolbar pendingDrafts={pendingDrafts} />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Floating AI Chat */}
      <MeetingChat />
    </div>
  );
}
