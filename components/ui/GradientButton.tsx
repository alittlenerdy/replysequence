'use client';

import { cn } from '@/lib/utils';
import { ArrowRight, Loader2 } from 'lucide-react';

interface GradientButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  external?: boolean;
}

export function GradientButton({
  children,
  href,
  onClick,
  className,
  showArrow = false,
  loading = false,
  disabled = false,
  type = 'button',
  size = 'md',
  variant = 'primary',
  external = false,
}: GradientButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300',
    sizeClasses[size],
    variant === 'primary'
      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
      : 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-gray-600',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const content = (
    <>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
      {showArrow && !loading && <ArrowRight className="w-4 h-4" />}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
    >
      {content}
    </button>
  );
}
