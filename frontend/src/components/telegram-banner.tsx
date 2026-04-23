'use client';

import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/i18n-context';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'data365_test_project_bot';

export function TelegramBanner() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading || !user || user.telegramChatId) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-accent/20 bg-accentSoft px-5 py-4">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-foreground">
          {t('telegramBanner.title')}
        </p>
        <p className="text-[12.5px] text-muted mt-0.5">
          {t('telegramBanner.subtitle')}
        </p>
      </div>
      <a
        href={`https://t.me/${BOT_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#229ED9] text-white px-4 py-2 text-[13px] font-semibold hover:bg-[#1e8dc2] transition-colors"
      >
        <span>✈️</span>
        {t('telegramBanner.cta')}
      </a>
    </div>
  );
}
