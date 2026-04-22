'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-borderSoft bg-surface px-3 h-9 text-[13px] text-foreground transition-all duration-150 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 hover:border-border appearance-none bg-no-repeat',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23757575' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
        backgroundPosition: 'right 0.75rem center',
        paddingRight: '2.25rem',
      }}
      {...props}
    >
      {children}
    </select>
  );
});
