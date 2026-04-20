import type { Metadata } from 'next';
import './globals.css';
import { Sidebar, MobileNav } from '@/components/navigation';
import { ToastProvider } from '@/components/ui/toast';
import { STRINGS } from '@/constants/strings';

export const metadata: Metadata = {
  title: `${STRINGS.app.name} — ${STRINGS.app.tagline}`,
  description: 'Business cash-flow management for Uzbek SMEs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 pb-20 lg:pb-0">
              <div className="mx-auto max-w-[1040px] px-6 py-8 page-fade">
                {children}
              </div>
            </main>
          </div>
          <MobileNav />
        </ToastProvider>
      </body>
    </html>
  );
}
