'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-lg border border-borderSoft bg-surface px-3 h-9 text-[13px] text-foreground placeholder:text-faint transition-all duration-150 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 hover:border-border';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(base, className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(base, 'h-auto py-2 leading-relaxed', className)}
      {...props}
    />
  );
});
