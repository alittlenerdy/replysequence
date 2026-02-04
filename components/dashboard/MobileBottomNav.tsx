'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart3, Settings, type LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { name: 'Drafts', href: '/dashboard', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface MobileBottomNavProps {
  pendingDrafts?: number;
}

export function MobileBottomNav({ pendingDrafts = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 light:border-gray-200 bg-gray-900/95 light:bg-white/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const badge = item.name === 'Drafts' ? pendingDrafts : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center py-2.5 px-4 min-w-[72px] min-h-[56px] transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
                ${isActive
                  ? 'text-blue-500'
                  : 'text-gray-400 light:text-gray-500 active:text-gray-200 light:active:text-gray-700'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 mb-0.5 transition-all ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                {badge > 0 && (
                  <span
                    className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white px-1"
                    aria-label={`${badge} pending`}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
