'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { formatPercent, formatUZS } from '@/lib/utils';
import { useTranslation } from '@/contexts/i18n-context';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  amount: number;
  change: number;
  tone?: 'success' | 'danger' | 'neutral';
  invertChange?: boolean;
  icon?: React.ReactNode;
}

const toneConfig = {
  success: {
    border:  'border-t-[3px] border-t-success',
    amount:  'text-success',
    bg:      'bg-gradient-to-br from-successSoft/60 to-surface',
    iconBg:  'bg-successSoft text-success',
  },
  danger: {
    border:  'border-t-[3px] border-t-danger',
    amount:  'text-danger',
    bg:      'bg-gradient-to-br from-dangerSoft/60 to-surface',
    iconBg:  'bg-dangerSoft text-danger',
  },
  neutral: {
    border:  'border-t-[3px] border-t-accent',
    amount:  'text-foreground',
    bg:      'bg-gradient-to-br from-accentSoft/50 to-surface',
    iconBg:  'bg-accentSoft text-accent',
  },
};

export function StatCard({
  label,
  amount,
  change,
  tone = 'neutral',
  invertChange,
  icon,
}: StatCardProps) {
  const { t } = useTranslation();
  const positive = invertChange ? change < 0 : change > 0;
  const negative = invertChange ? change > 0 : change < 0;
  const ChangeIcon = change === 0 ? Minus : positive ? ArrowUp : ArrowDown;
  const cfg = toneConfig[tone];

  const changeColor = positive
    ? 'text-success bg-successSoft'
    : negative
      ? 'text-danger bg-dangerSoft'
      : 'text-muted bg-surfaceAlt';

  return (
    <div
      className={cn(
        'rounded-xl border border-borderSoft shadow-card overflow-hidden',
        cfg.border,
        cfg.bg,
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wider">
            {label}
          </p>
          {icon && (
            <span className={cn('h-8 w-8 rounded-lg grid place-items-center shrink-0', cfg.iconBg)}>
              {icon}
            </span>
          )}
        </div>

        <p className={cn('mt-3 text-[28px] font-bold tabular leading-none', cfg.amount)}>
          {formatUZS(amount)}
          <span className="text-[13px] font-normal text-muted ml-1.5">
            {t('common.currency')}
          </span>
        </p>

        <div className={cn(
          'mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-1 rounded-full',
          changeColor,
        )}>
          <ChangeIcon className="h-3 w-3" />
          <span className="tabular">{formatPercent(change)}</span>
          <span className="opacity-70 ml-0.5">{t('common.vsPrevious')}</span>
        </div>
      </div>
    </div>
  );
}
