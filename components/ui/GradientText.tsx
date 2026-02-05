'use client';

import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function GradientText({ children, className, variant = 'primary' }: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-clip-text text-transparent',
        variant === 'primary'
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'
          : 'bg-gradient-to-r from-purple-400 to-pink-400',
        className
      )}
    >
      {children}
    </span>
  );
}
