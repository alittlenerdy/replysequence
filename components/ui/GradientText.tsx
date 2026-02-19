import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'amber';
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600',
  secondary: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
  amber: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500',
} as const;

export function GradientText({ children, className, variant = 'primary' }: GradientTextProps) {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent',
        variantClasses[variant],
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
