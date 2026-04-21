'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/i18n-context';
import { LanguageSwitcher } from '@/components/language-switcher';

function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
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

  if (!user) return null;

  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? 'K';

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        className={cn(
          'h-9 w-9 rounded-full grid place-items-center text-[13px] font-medium transition-colors',
          open
            ? 'bg-accent text-white'
            : 'bg-accentSoft text-accent hover:bg-accent hover:text-white',
        )}
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-md border border-border bg-surface shadow-lg py-1 z-50">
          <div className="px-3 py-2.5 border-b border-borderSoft">
            <div className="text-[13px] font-medium truncate">{user.name}</div>
            <div className="text-[11.5px] text-muted tabular truncate mt-0.5">
              {user.phone}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left text-foreground/80 hover:bg-surfaceAlt"
          >
            <LogOut className="h-[16px] w-[16px]" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded bg-accent grid place-items-center text-white font-medium text-[14px] shrink-0">
            K
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="text-[15px] font-medium leading-tight truncate">
              {t('app.name')}
            </div>
            <div className="text-[11.5px] text-muted leading-tight mt-0.5 truncate">
              {t('app.tagline')}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher variant="compact" />
          <div className="h-6 w-px bg-borderSoft mx-1" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
