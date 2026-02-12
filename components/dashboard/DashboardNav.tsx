'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart3, Settings, CreditCard, Sparkles, type LucideIcon } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { name: 'Drafts', href: '/dashboard', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Pricing', href: '/dashboard/pricing', icon: Sparkles },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface DashboardNavProps {
  pendingDrafts?: number;
}

export function DashboardNav({ pendingDrafts = 0 }: DashboardNavProps) {
  const pathname = usePathname();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Add badge to Drafts tab if there are pending drafts
  const tabsWithBadges = tabs.map(tab =>
    tab.name === 'Drafts' && pendingDrafts > 0
      ? { ...tab, badge: pendingDrafts }
      : tab
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = index > 0 ? index - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      tabRefs.current[nextIndex]?.focus();
    }
  }, []);

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
                relative flex items-center gap-2.5 px-5 py-3.5 border-b-[3px] text-sm transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 light:focus-visible:ring-offset-white
                ${isActive
                  ? 'border-blue-500 text-white light:text-blue-600 bg-blue-500/10 light:bg-blue-50 font-semibold'
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
                  className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold rounded-full bg-red-500 text-white shadow-sm shadow-red-500/30"
                  aria-label={`${badge} pending drafts`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
