'use client';

import { usePathname } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/navigation';
import { TopBar } from '@/components/top-bar';

const PUBLIC_PREFIXES = ['/login', '/register'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublic) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0 overflow-auto">
          <div className="px-5 py-6 lg:px-8 lg:py-7 max-w-[1280px] page-fade">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
