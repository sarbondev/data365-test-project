'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90',
  ghost: 'text-foreground hover:bg-surfaceAlt',
  danger: 'bg-danger/10 text-danger hover:bg-danger/15',
  outline:
    'border border-border bg-surface text-foreground hover:bg-surfaceAlt',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px]',
  md: 'h-9 px-4 text-[13px]',
  icon: 'h-8 w-8 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = 'primary', size = 'md', loading, children, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors',
          'disabled:opacity-40 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);
