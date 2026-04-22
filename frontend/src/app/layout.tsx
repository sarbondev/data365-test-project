import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/contexts/auth-context';
import { I18nProvider } from '@/contexts/i18n-context';
import { AppShell } from '@/components/app-shell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://data365.sarbondev.uz';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Data365 — Biznes Moliya Menejeri',
    template: '%s | Data365',
  },
  description:
    "O'zbekistondagi kichik va o'rta bizneslar uchun pul oqimini boshqarish tizimi. Kirim-chiqimlarni kuzating, tahlil qiling va Telegram bot orqali boshqaring.",
  keywords: [
    'biznes moliya', 'kassa menejeri', "pul oqimi", "kirim chiqim", 'SME Uzbekistan',
    'финансы бизнеса', 'управление деньгами', 'касса', 'доходы расходы',
    'finance manager', 'cash flow', 'SME', 'Uzbekistan', 'Telegram bot',
    'data365', 'moliya', 'бухгалтерия',
  ],
  authors: [{ name: 'Data365', url: SITE_URL }],
  creator: 'Data365',
  publisher: 'Data365',
  robots: { index: true, follow: true },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'uz': `${SITE_URL}`,
      'ru': `${SITE_URL}`,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Data365',
    title: "Data365 — Biznes uchun moliya menejeri",
    description:
      "Kirim va chiqimlarni kuzating, tahlil qiling, Telegram orqali boshqaring. O'zbekiston SME uchun.",
    locale: 'uz_UZ',
    alternateLocale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Data365 — Biznes Moliya Menejeri',
    description: "O'zbekiston SME uchun pul oqimini boshqarish tizimi",
  },
  icons: {
    icon: '/favicon.ico',
  },
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
