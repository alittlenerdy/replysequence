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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <>
      <DashboardMarginBubbles />
      {children}
    </>
  );
}
