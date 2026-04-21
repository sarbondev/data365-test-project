'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Tags,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/i18n-context';

const NAV_ITEMS = [
  { href: '/', key: 'nav.overview' as const, icon: LayoutDashboard },
  { href: '/transactions', key: 'nav.transactions' as const, icon: Receipt },
  { href: '/analytics', key: 'nav.analytics' as const, icon: BarChart3 },
  { href: '/categories', key: 'nav.categories' as const, icon: Tags },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 border-r border-border bg-surface">
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-[13.5px] transition-colors',
                    active
                      ? 'bg-accent text-white font-medium'
                      : 'text-foreground/80 hover:bg-surfaceAlt',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-3 border-t border-borderSoft">
        <p className="text-[11px] text-muted">
          © {new Date().getFullYear()} data365
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors',
                  active ? 'text-accent' : 'text-muted',
                )}
              >
                <Icon className="h-[20px] w-[20px]" />
                <span>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
