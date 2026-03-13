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
      {/* Ambient gradient mesh — vivid neon orbs for glass to blur */}
      <div className="pointer-events-none fixed inset-0 light:hidden" aria-hidden="true">
        <div className="absolute top-[-8%] left-[-3%] w-[45%] h-[55%] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(99, 102, 241, 0.06) 40%, transparent 70%)' }} />
        <div className="absolute top-[15%] right-[-6%] w-[40%] h-[45%] rounded-full blur-[90px]" style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, rgba(245, 158, 11, 0.04) 40%, transparent 70%)' }} />
        <div className="absolute top-[45%] left-[25%] w-[30%] h-[35%] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.03) 40%, transparent 70%)' }} />
        <div className="absolute bottom-[-5%] left-[5%] w-[35%] h-[40%] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)' }} />
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
