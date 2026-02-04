'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart3, Settings } from 'lucide-react';

export function DashboardNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Drafts', href: '/dashboard', icon: FileText },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="border-b border-white/10 mb-8">
      <nav className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all
                ${isActive
                  ? 'border-blue-500 text-white bg-blue-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
