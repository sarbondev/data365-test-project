'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/[0.18] backdrop-blur-[3px] animate-fade-in" />
      <div
        className={cn(
          'relative bg-white rounded-2xl p-6 max-w-sm w-full',
          'border border-black/[0.07] shadow-modal animate-scale-in',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1.5 text-[13px] text-muted leading-relaxed">{description}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 h-9 text-[13px] font-medium text-muted hover:bg-surfaceAlt transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'rounded-lg px-4 h-9 text-[13px] font-medium text-white transition-colors',
              destructive
                ? 'bg-danger hover:bg-danger/90'
                : 'bg-accent hover:bg-accentHover',
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
