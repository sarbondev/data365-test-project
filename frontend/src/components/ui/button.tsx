'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline' | 'soft';
type Size    = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accentHover active:scale-[0.98]',
  soft:    'bg-accentSoft text-accent hover:bg-primary-100 active:bg-primary-100',
  ghost:   'text-muted hover:bg-surfaceAlt hover:text-foreground active:bg-surfaceAlt',
  danger:  'bg-dangerSoft text-danger hover:bg-danger/15 active:bg-danger/20',
  outline: 'border border-borderSoft bg-surface text-foreground hover:bg-surfaceAlt hover:border-border active:scale-[0.98]',
};

const sizeClasses: Record<Size, string> = {
  sm:   'h-8 px-3 text-[12.5px] gap-1.5',
  md:   'h-9 px-4 text-[13px] gap-2',
  lg:   'h-10 px-5 text-[13.5px] gap-2',
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
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:pointer-events-none',
          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
        )}
        {children}
      </button>
    );
  },
);
