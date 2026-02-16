'use client';

import { useEffect } from 'react';

export function ForceDarkMode() {
  useEffect(() => {
    const html = document.documentElement;
    // Remove light class immediately
    html.classList.remove('light');

    // Watch for any re-additions (e.g., ThemeToggle race condition)
    const observer = new MutationObserver(() => {
      if (html.classList.contains('light')) {
        html.classList.remove('light');
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      // Restore theme from localStorage when leaving the page
      const theme = localStorage.getItem('theme');
      if (theme === 'light') {
        html.classList.add('light');
      }
    };
  }, []);
  return null;
}
