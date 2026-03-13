'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart3, Settings, Users, Home, Video, Layers, Contact, type LucideIcon } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Meetings', href: '/dashboard/meetings', icon: Video },
  { name: 'Drafts', href: '/dashboard/drafts', icon: FileText },
  { name: 'Sequences', href: '/dashboard/sequences', icon: Layers },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Contact },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Waitlist', href: '/dashboard/waitlist', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const ADMIN_EMAIL = 'jimmy@replysequence.com';

interface DashboardNavProps {
  pendingDrafts?: number;
  userEmail?: string;
}

export function DashboardNav({ pendingDrafts = 0, userEmail = '' }: DashboardNavProps) {
  const pathname = usePathname();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Only show Waitlist tab for admin
  const visibleTabs = tabs.filter(tab =>
    tab.name !== 'Waitlist' || userEmail === ADMIN_EMAIL
  );

  // Add badge to Drafts tab if there are pending drafts
  const tabsWithBadges = visibleTabs.map(tab =>
    tab.name === 'Drafts' && pendingDrafts > 0
      ? { ...tab, badge: pendingDrafts }
      : tab
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    const count = visibleTabs.length;

    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = index > 0 ? index - 1 : count - 1;
        break;
      case 'ArrowRight':
        nextIndex = index < count - 1 ? index + 1 : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = count - 1;
        break;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      tabRefs.current[nextIndex]?.focus();
    }
  }, [visibleTabs.length]);

  return (
    <div className="hidden md:block border-b border-white/10 light:border-gray-200 mb-8">
      <nav
        className="flex gap-1"
        role="tablist"
        aria-label="Dashboard navigation"
      >
        {tabsWithBadges.map((tab, index) => {
          // Handle exact match for /dashboard, or startsWith for other routes
          const isActive = tab.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const badge = 'badge' in tab ? tab.badge : undefined;

          return (
            <Link
              key={tab.href}
              ref={(el) => { tabRefs.current[index] = el; }}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                relative flex items-center gap-2.5 px-5 py-3.5 border-b-[3px] text-sm transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white
                ${isActive
                  ? 'border-[#5B6CFF] text-white light:text-[#4A5BEE] bg-[#5B6CFF]/10 light:bg-[#EEF0FF] font-semibold'
                  : 'border-transparent text-gray-400 light:text-gray-500 hover:text-gray-200 light:hover:text-gray-700 hover:bg-white/5 light:hover:bg-gray-100 font-medium'
                }
              `}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.25 : 2}
                aria-hidden="true"
              />
              <span>{tab.name}</span>
              {badge !== undefined && badge > 0 && (
                <span
                  className="ml-1 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 animate-pulse"
                  aria-label={`${badge} pending drafts`}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
