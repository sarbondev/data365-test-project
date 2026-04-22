import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'income' | 'expense' | 'neutral' | 'warning';
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  income: 'bg-success/10 text-success',
  expense: 'bg-danger/10 text-danger',
  neutral: 'bg-surfaceAlt text-muted',
  warning: 'bg-warning/10 text-warning',
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
