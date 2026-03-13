'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { FileText, BarChart3, CreditCard, Settings, Users, Home, type LucideIcon } from 'lucide-react';
import { ActiveIndicator } from '../landing/ActiveIndicator';
import { ToolbarThemeToggle } from '../landing/ToolbarThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Drafts', href: '/dashboard', icon: FileText },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Waitlist', href: '/dashboard/waitlist', icon: Users, adminOnly: true },
];

const ADMIN_EMAIL = 'jimmy@replysequence.com';

interface DashboardToolbarProps {
  firstName?: string;
  pendingDrafts?: number;
  userEmail?: string;
}

export function DashboardToolbar({ firstName = 'there', pendingDrafts = 0, userEmail = '' }: DashboardToolbarProps) {
  const pathname = usePathname();
  const buttonRefs = useRef<(HTMLElement | null)[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [indicatorPos, setIndicatorPos] = useState({ left: 0, width: 0 });

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || userEmail === ADMIN_EMAIL);

  const activeIndex = visibleItems.findIndex(item =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href)
  );

  // Measure button positions for indicator
  const updateIndicatorPos = useCallback(() => {
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const btn = buttonRefs.current[idx];
    if (btn && toolbarRef.current) {
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorPos({
        left: btnRect.left - toolbarRect.left,
        width: btnRect.width,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    updateIndicatorPos();
  }, [updateIndicatorPos]);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const observer = new ResizeObserver(() => updateIndicatorPos());
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, [updateIndicatorPos]);

  return (
    <>
      {/* Ambient glow */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[120px] pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Toolbar */}
      <div
        ref={toolbarRef}
        className="toolbar-noise fixed z-50 flex items-center gap-1 px-2 py-2 rounded-2xl bg-gray-900/60 light:bg-white/70 backdrop-blur-xl border border-white/[0.08] light:border-gray-200/50 shadow-2xl overflow-hidden bottom-4 left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Active indicator ring */}
        {activeIndex >= 0 && (
          <ActiveIndicator left={indicatorPos.left} width={indicatorPos.width} />
        )}

        {/* Logo — always visible */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors relative z-10 flex-shrink-0"
          title="Back to home"
        >
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
          <span className="hidden md:inline text-sm font-bold bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 light:from-indigo-600 light:to-indigo-600 bg-clip-text text-transparent">
            RS
          </span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 light:bg-gray-300/50 mx-1 flex-shrink-0" />

        {/* Nav items — scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;
            const badge = item.label === 'Drafts' ? pendingDrafts : 0;

            return (
              <Link
                key={item.href}
                ref={(el: HTMLAnchorElement | null) => { buttonRefs.current[index] = el; }}
                href={item.href}
                className="relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors flex-shrink-0"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive
                        ? 'text-indigo-400 light:text-indigo-600'
                        : 'text-gray-400 light:text-gray-500'
                    }`}
                    strokeWidth={1.5}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-0.5 shadow-lg shadow-red-500/30">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span
                  className={`hidden md:inline text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-white light:text-gray-900'
                      : 'text-gray-400 light:text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 light:bg-gray-300/50 mx-1 flex-shrink-0" />

        {/* Utility section */}
        <div className="flex items-center gap-1 relative z-10 flex-shrink-0">
          {/* Greeting — desktop only */}
          <span className="hidden lg:inline text-xs text-gray-400 light:text-gray-500 px-1">
            Hey, <span className="font-medium text-white light:text-gray-900">{firstName}</span>
          </span>

          {/* Theme toggle */}
          <ToolbarThemeToggle />

          {/* User button */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
