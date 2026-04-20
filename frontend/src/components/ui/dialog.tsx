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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-surface border border-border rounded-lg shadow-card p-6 max-w-sm w-full">
        <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
        {description && (
          <p className="mt-2 text-[13px] text-muted">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded px-4 h-9 text-[13px] font-medium text-foreground hover:bg-surfaceAlt"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'rounded px-4 h-9 text-[13px] font-medium text-white',
              destructive
                ? 'bg-danger hover:bg-danger/90'
                : 'bg-accent hover:bg-accent/90',
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
