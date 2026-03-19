'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Syncs the theme from localStorage to the DOM on every route change.
 * This ensures the `light` / `dark` class on <html> stays correct
 * when navigating between layouts (e.g., public pages → dashboard).
 */
export function ThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const stored = localStorage.getItem('rs-theme');

    if (stored === 'light') {
      html.classList.add('light');
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }
  }, [pathname]);

  return null;
}
