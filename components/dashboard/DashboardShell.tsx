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
      {/* Ambient neon mesh — subtle fixed glow accents */}
      <div className="pointer-events-none fixed inset-0 light:hidden" aria-hidden="true">
        {/* Top-left blue/indigo accent */}
        <div className="absolute top-[-5%] left-[-2%] w-[30%] h-[30%] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)' }} />
        {/* Top-right orange accent */}
        <div className="absolute top-[5%] right-[-3%] w-[25%] h-[25%] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)' }} />
        {/* Center-left violet accent */}
        <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07) 0%, transparent 70%)' }} />
        {/* Bottom subtle cyan */}
        <div className="absolute bottom-[5%] right-[15%] w-[18%] h-[18%] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)' }} />
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
