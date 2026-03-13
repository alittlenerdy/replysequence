'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.[0] || '';
  const l = lastName?.[0] || '';
  return (f + l).toUpperCase() || '?';
}

export function UserAvatar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(user?.firstName, user?.lastName);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #5B6CFF, #7A5CFF)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-48 rounded-xl bg-gray-900 light:bg-white border border-gray-700/50 light:border-gray-200 shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-gray-700/50 light:border-gray-100">
            <p className="text-sm font-medium text-white light:text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 light:text-gray-600 hover:bg-white/5 light:hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 light:text-gray-600 hover:bg-white/5 light:hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
