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
    <div className="border-b border-white/10 light:border-gray-200 mb-8">
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
                  ? 'border-blue-500 text-white light:text-blue-600 bg-blue-500/10 light:bg-blue-50'
                  : 'border-transparent text-gray-400 light:text-gray-500 hover:text-gray-200 light:hover:text-gray-700 hover:bg-white/5 light:hover:bg-gray-100'
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
