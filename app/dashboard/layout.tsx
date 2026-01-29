'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const DashboardMarginBubbles = dynamic(() => import('@/components/DashboardMarginBubbles'), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sync theme from localStorage on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const html = document.documentElement;

    if (theme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      // Default to dark
      html.classList.add('dark');
      html.classList.remove('light');
    }
  }, []);

  return (
    <>
      <DashboardMarginBubbles />
      {children}
    </>
  );
}
