import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'amber';
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-[#7A8BFF] via-[#5B6CFF] to-[#4A5BEE]',
  secondary: 'bg-gradient-to-r from-[#5B6CFF] to-[#4A5BEE]',
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
