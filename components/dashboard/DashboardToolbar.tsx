'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, BarChart3, Settings, Home, Video, Layers, Contact, type LucideIcon } from 'lucide-react';
import { ActiveIndicator } from '../landing/ActiveIndicator';
import { ToolbarThemeToggle } from '../landing/ToolbarThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  mobileHidden?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Meetings', href: '/dashboard/meetings', icon: Video, mobileHidden: true },
  { label: 'Drafts', href: '/dashboard/drafts', icon: FileText },
  { label: 'Sequences', href: '/dashboard/sequences', icon: Layers, mobileHidden: true },
  { label: 'Contacts', href: '/dashboard/contacts', icon: Contact, mobileHidden: true },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface DashboardToolbarProps {
  firstName?: string;
  pendingDrafts?: number;
  userEmail?: string;
}

export function DashboardToolbar({ pendingDrafts = 0 }: DashboardToolbarProps) {
  const pathname = usePathname();
  const buttonRefs = useRef<(HTMLElement | null)[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [indicatorPos, setIndicatorPos] = useState({ left: 0, width: 0 });

  const activeIndex = NAV_ITEMS.findIndex(item =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href)
  );

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
          background: 'radial-gradient(ellipse, rgba(91,108,255,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Toolbar — navigation only */}
      <div
        ref={toolbarRef}
        className="toolbar-noise fixed z-50 flex items-center gap-1 px-2 py-2 rounded-2xl bg-gray-900/60 light:bg-white/70 backdrop-blur-xl border border-white/[0.08] light:border-gray-200/50 shadow-2xl overflow-hidden bottom-4 left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Active indicator ring */}
        {activeIndex >= 0 && (
          <ActiveIndicator left={indicatorPos.left} width={indicatorPos.width} />
        )}

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors relative z-10 flex-shrink-0"
          title="Back to home"
        >
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
          <span className="hidden md:inline text-sm font-bold bg-gradient-to-r from-[#7A8BFF] via-[#5B6CFF] to-[#4A5BEE] light:from-[#4A5BEE] light:to-[#4A5BEE] bg-clip-text text-transparent">
            RS
          </span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 light:bg-gray-300/50 mx-1 flex-shrink-0" />

        {/* Nav items */}
        <div className="flex items-center gap-2 sm:gap-1 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;
            const hasStatus = item.label === 'Drafts' && pendingDrafts > 0;

            return (
              <Link
                key={item.href}
                ref={(el: HTMLAnchorElement | null) => { buttonRefs.current[index] = el; }}
                href={item.href}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] justify-center rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors flex-shrink-0${item.mobileHidden ? ' hidden sm:flex' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive
                        ? 'text-[#5B6CFF] light:text-[#4A5BEE] drop-shadow-[0_0_6px_rgba(91,108,255,0.5)]'
                        : 'text-gray-400 light:text-gray-500'
                    }`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {/* Status dot instead of numeric badge */}
                  {hasStatus && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 animate-pulse" />
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

        {/* Theme toggle only — user profile moves to top-right */}
        <div className="flex items-center relative z-10 flex-shrink-0">
          <ToolbarThemeToggle />
        </div>
      </div>
    </>
  );
}
