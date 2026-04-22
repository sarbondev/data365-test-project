'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, BarChart3, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/i18n-context';

const NAV_ITEMS = [
  { href: '/',             key: 'nav.overview'     as const, icon: LayoutDashboard },
  { href: '/transactions', key: 'nav.transactions' as const, icon: Receipt },
  { href: '/analytics',   key: 'nav.analytics'    as const, icon: BarChart3 },
  { href: '/categories',  key: 'nav.categories'   as const, icon: Tags },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-borderSoft bg-surface">
      <nav className="flex-1 px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon   = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150',
                    active
                      ? 'bg-accentSoft text-accent'
                      : 'text-muted hover:bg-surfaceAlt hover:text-foreground',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-accent rounded-r-full" />
                  )}
                  <Icon
                    className={cn(
                      'h-[17px] w-[17px] shrink-0 transition-colors',
                      active ? 'text-accent' : 'text-faint',
                    )}
                  />
                  <span>{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-5 py-3 border-t border-borderSoft">
        <p className="text-[11px] text-faint">© {new Date().getFullYear()} data365</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-borderSoft bg-surface/95 backdrop-blur-sm">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon   = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150',
                  active ? 'text-accent' : 'text-faint',
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center h-7 w-10 rounded-full transition-colors duration-150',
                    active && 'bg-accentSoft',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
