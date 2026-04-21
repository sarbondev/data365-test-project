'use client';

import { usePathname } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/navigation';

const PUBLIC_PREFIXES = ['/login', '/register'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="mx-auto max-w-[1040px] px-6 py-8 page-fade">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </>
  );
}
