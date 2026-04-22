'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HorizontalBars, TrendLine } from '@/components/charts';
import { FullPageSpinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatUZS, isoDate } from '@/lib/utils';
import { useTranslation } from '@/contexts/i18n-context';
import { cn } from '@/lib/utils';
import type {
  BudgetResponse,
  ByCategoryResponse,
  OverviewResponse,
  Period,
  TrendResponse,
} from '@/lib/types';

const PERIOD_IDS: Period[] = ['week', 'month', 'last-month', 'custom'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = React.useState<Period>('month');
  const [startDate, setStartDate] = React.useState(
    isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  );
  const [endDate, setEndDate] = React.useState(isoDate(new Date()));

  const [overview, setOverview] = React.useState<OverviewResponse | null>(null);
  const [income, setIncome] = React.useState<ByCategoryResponse | null>(null);
  const [expense, setExpense] = React.useState<ByCategoryResponse | null>(null);
  const [trend, setTrend] = React.useState<TrendResponse | null>(null);
  const [budget, setBudget] = React.useState<BudgetResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const sd = period === 'custom' ? startDate : undefined;
      const ed = period === 'custom' ? endDate : undefined;
      const [ov, inc, exp, tr, bud] = await Promise.all([
        api.analytics.overview(period, sd, ed),
        api.analytics.byCategory(period, sd, ed, 'INCOME'),
        api.analytics.byCategory(period, sd, ed, 'EXPENSE'),
        api.analytics.trend(period, sd, ed),
        api.analytics.budget(),
      ]);
      setOverview(ov);
      setIncome(inc);
      setExpense(exp);
      setTrend(tr);
      setBudget(bud);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading || !overview) return <FullPageSpinner />;

  const currencyLabel = t('common.currency');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold tracking-tight">{t('analytics.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-border rounded-lg overflow-hidden">
            {PERIOD_IDS.map((pid, i) => (
              <button
                key={pid}
                onClick={() => setPeriod(pid)}
                className={cn(
                  'px-3 h-8 text-[12px] font-medium transition-colors',
                  i > 0 && 'border-l border-border',
                  period === pid
                    ? 'bg-accent text-white'
                    : 'bg-surface text-muted hover:bg-surfaceAlt',
                )}
              >
                {t(`periods.${pid}` as const)}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wider">
            {t('analytics.avgDaily')}
          </p>
          <p className="mt-3 text-[22px] font-medium tabular text-danger">
            {formatUZS(overview.stats?.avgDailyExpense ?? 0)}
            <span className="text-[13px] font-normal text-muted ml-1.5">
              {currencyLabel}
            </span>
          </p>
        </Card>
        <Card>
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wider">
            {t('analytics.biggestExpense')}
          </p>
          {overview.stats?.biggestExpense ? (
            <>
              <p className="mt-3 text-[26px] font-bold tabular text-danger leading-none">
                {formatUZS(overview.stats.biggestExpense.amount)}
                <span className="text-[13px] font-normal text-muted ml-1.5">
                  {currencyLabel}
                </span>
              </p>
              <p className="mt-1 text-[12px] text-muted">
                {overview.stats.biggestExpense.category}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[13px] text-muted">—</p>
          )}
        </Card>
        <Card>
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wider">
            {t('analytics.mostActive')}
          </p>
          {overview.stats?.mostActiveCategory ? (
            <>
              <p className="mt-3 text-[22px] font-bold leading-none">
                {overview.stats.mostActiveCategory.name}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                {overview.stats.mostActiveCategory.count}{' '}
                {t('transactions.count')}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[13px] text-muted">—</p>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.incomeByCategory')}</CardTitle>
          </CardHeader>
          <HorizontalBars
            data={(income?.items ?? []).map((i) => ({
              name: i.name,
              value: i.total,
              color: i.color,
            }))}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.expenseByCategory')}</CardTitle>
          </CardHeader>
          <HorizontalBars
            data={(expense?.items ?? []).map((i) => ({
              name: i.name,
              value: i.total,
              color: i.color,
            }))}
          />
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.dailyTrend')}</CardTitle>
        </CardHeader>
        <TrendLine data={trend?.points ?? []} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.budget')}</CardTitle>
        </CardHeader>
        {budget && budget.items.length > 0 ? (
          <div className="space-y-4">
            {budget.items.map((b) => {
              const usage = Math.min(100, b.usage);
              const tone =
                b.status === 'EXCEEDED'
                  ? 'bg-danger'
                  : b.status === 'WARNING'
                    ? 'bg-warning'
                    : 'bg-success';
              return (
                <div key={b.categoryId}>
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                      <span>
                        {b.icon ? `${b.icon} ` : ''}
                        {b.name}
                      </span>
                    </div>
                    <span className="text-muted tabular">
                      {formatUZS(b.spent)} / {formatUZS(b.budget)}{' '}
                      {currencyLabel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surfaceAlt rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tone} transition-all`}
                      style={{ width: `${usage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {b.usage.toFixed(0)}% {t('analytics.spent')} ·{' '}
                    {formatUZS(b.remaining)} {currencyLabel}{' '}
                    {t('analytics.remaining')}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-muted">{t('analytics.noBudget')}</p>
        )}
      </Card>
    </div>
  );
}
