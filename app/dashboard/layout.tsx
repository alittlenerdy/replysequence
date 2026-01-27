'use client';

import dynamic from 'next/dynamic';

const DashboardMarginBubbles = dynamic(() => import('@/components/DashboardMarginBubbles'), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardMarginBubbles />
      {children}
    </>
  );
}
