'use client';

import { useEffect } from 'react';

export function ForceDarkMode() {
  useEffect(() => {
    const html = document.documentElement;
    const wasLight = html.classList.contains('light');
    html.classList.remove('light');
    return () => {
      if (wasLight) html.classList.add('light');
    };
  }, []);
  return null;
}
