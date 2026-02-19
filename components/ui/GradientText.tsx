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
        'inline-block bg-clip-text text-transparent',
        variant === 'primary'
          ? 'bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600'
          : 'bg-gradient-to-r from-indigo-400 to-indigo-600',
        className
      )}
      style={{
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </span>
  );
}
