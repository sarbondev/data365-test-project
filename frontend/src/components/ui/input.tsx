'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded border border-border bg-surface px-3 h-9 text-[13px] text-foreground placeholder:text-faint transition-colors focus:outline-none focus:border-accent';

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
