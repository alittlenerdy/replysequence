import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'amber';
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-[#818CF8] via-[#6366F1] to-[#4F46E5]',
  secondary: 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5]',
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
