'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, ChevronDown } from 'lucide-react';
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

  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? 'U';

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        className={cn(
          'flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-colors duration-150',
          open ? 'bg-surfaceAlt' : 'hover:bg-surfaceAlt',
        )}
      >
        <span className="h-7 w-7 rounded-full bg-accent grid place-items-center text-[12px] font-semibold text-white shrink-0">
          {initial}
        </span>
        <span className="hidden sm:block text-[13px] font-medium text-foreground max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={cn(
            'hidden sm:block h-3.5 w-3.5 text-muted transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-borderSoft bg-surface shadow-dropdown py-1.5 z-50 animate-scale-in">
          <div className="px-4 py-2.5 border-b border-borderSoft">
            <div className="text-[13px] font-semibold text-foreground truncate">{user.name}</div>
            <div className="text-[11.5px] text-muted tabular mt-0.5 truncate">{user.phone}</div>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-left text-muted hover:bg-surfaceAlt hover:text-foreground transition-colors duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
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
    <header className="sticky top-0 z-30 h-14 border-b border-borderSoft bg-surface/95 backdrop-blur-sm">
      <div className="h-full px-4 lg:px-5 flex items-center justify-between gap-3">

        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center text-white font-bold text-[13px] shrink-0">
            D
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="text-[14px] font-bold leading-tight text-foreground tracking-tight truncate">
              data365
            </div>
            <div className="text-[11px] text-faint leading-tight mt-px truncate">
              {t('app.tagline')}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          <div className="h-5 w-px bg-borderSoft mx-0.5" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
