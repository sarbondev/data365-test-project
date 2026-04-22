'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
  success: (m: string) => void;
  error: (m: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const DURATION = 3800;
const EXIT_DURATION = 200;

const icons: Record<ToastKind, React.ReactNode> = {
  success: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 6.5V10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <circle cx="7" cy="4.5" r="0.75" fill="currentColor"/>
    </svg>
  ),
};

const kindStyles: Record<ToastKind, { icon: string; bar: string }> = {
  success: {
    icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60',
    bar:  'bg-emerald-400',
  },
  error: {
    icon: 'bg-red-50 text-red-500 ring-1 ring-red-200/60',
    bar:  'bg-red-400',
  },
  info: {
    icon: 'bg-blue-50 text-blue-500 ring-1 ring-blue-200/60',
    bar:  'bg-blue-400',
  },
};

function Toast({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: number) => void;
}) {
  const styles = kindStyles[item.kind];

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 w-[320px] max-w-[calc(100vw-2.5rem)]',
        'bg-white/[0.97] backdrop-blur-xl rounded-2xl px-4 py-3.5',
        'shadow-toast border border-black/[0.06]',
        'overflow-hidden',
        item.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right',
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center',
          styles.icon,
        )}
      >
        {icons[item.kind]}
      </span>

      <p className="flex-1 text-[13px] font-medium text-foreground leading-snug">
        {item.message}
      </p>

      <button
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-faint hover:text-muted hover:bg-surfaceAlt transition-colors"
        aria-label="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* countdown bar */}
      <div
        className={cn('absolute bottom-0 left-0 h-[2.5px] w-full origin-left rounded-b-2xl', styles.bar)}
        style={{ animation: `toastProgress ${DURATION}ms linear forwards` }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION);
  }, []);

  const show = React.useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), DURATION);
    },
    [remove],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error:   (m) => show(m, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col-reverse gap-2.5"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast item={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
