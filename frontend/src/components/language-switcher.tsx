'use client';

import * as React from 'react';
import { Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type Locale,
  SUPPORTED_LOCALES,
  useI18n,
} from '@/contexts/i18n-context';

const LABELS: Record<Locale, { native: string; short: string }> = {
  uz: { native: "O'zbek", short: 'UZ' },
  ru: { native: 'Русский', short: 'RU' },
};

type Variant = 'menu' | 'inline' | 'pill' | 'compact';

export function LanguageSwitcher({
  variant = 'menu',
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex border border-border rounded overflow-hidden',
          className,
        )}
      >
        {SUPPORTED_LOCALES.map((l, i) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={cn(
              'px-3 h-8 text-[12px] font-medium transition-colors',
              i > 0 && 'border-l border-border',
              locale === l
                ? 'bg-accent text-white'
                : 'bg-surface text-muted hover:bg-surfaceAlt',
            )}
          >
            {LABELS[l].short}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex gap-1', className)}>
        {SUPPORTED_LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={cn(
              'h-7 px-2.5 rounded-full text-[11.5px] font-medium transition-colors border',
              locale === l
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-muted border-border hover:bg-surfaceAlt',
            )}
          >
            {LABELS[l].short}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div ref={wrapRef} className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Language"
          className={cn(
            'h-9 px-2.5 inline-flex items-center gap-1.5 rounded-md text-[12.5px] font-medium transition-colors',
            open
              ? 'bg-surfaceAlt text-foreground'
              : 'text-muted hover:bg-surfaceAlt hover:text-foreground',
          )}
        >
          <Globe className="h-[16px] w-[16px]" />
          <span className="tabular">{LABELS[locale].short}</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 min-w-[160px] rounded-md border border-border bg-surface shadow-lg py-1 z-50">
            {SUPPORTED_LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left hover:bg-surfaceAlt"
              >
                <span className="flex-1">{LABELS[l].native}</span>
                {locale === l && (
                  <Check className="h-3.5 w-3.5 text-accent" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded text-[13px] text-foreground/80 hover:bg-surfaceAlt"
      >
        <Globe className="h-[16px] w-[16px]" />
        <span className="flex-1 text-left">{LABELS[locale].native}</span>
        <span className="text-[11px] text-muted">{LABELS[locale].short}</span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 rounded border border-border bg-surface shadow-md z-50">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left hover:bg-surfaceAlt"
            >
              <span className="flex-1">{LABELS[l].native}</span>
              {locale === l && <Check className="h-3.5 w-3.5 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
