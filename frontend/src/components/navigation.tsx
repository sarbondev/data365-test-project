'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Tags,
} from 'lucide-react';
import { STRINGS } from '@/constants/strings';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: STRINGS.nav.overview, icon: LayoutDashboard },
  { href: '/transactions', label: STRINGS.nav.transactions, icon: Receipt },
  { href: '/analytics', label: STRINGS.nav.analytics, icon: BarChart3 },
  { href: '/categories', label: STRINGS.nav.categories, icon: Tags },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 border-r border-border bg-surface">
      <div className="px-6 pt-7 pb-6 border-b border-borderSoft">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-accent grid place-items-center text-white font-medium text-[14px]">
            K
          </div>
          <div>
            <div className="text-[15px] font-medium leading-tight">
              {STRINGS.app.name}
            </div>
            <div className="text-[11.5px] text-muted leading-tight mt-0.5">
              {STRINGS.app.tagline}
            </div>
          </div>
        </Link>
      </div>

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
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-4 border-t border-borderSoft">
        <p className="text-[11px] text-muted">
          © {new Date().getFullYear()} data365
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
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
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
