'use client';

import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { isoDate } from '@/lib/utils';
import { STRINGS } from '@/constants/strings';
import { StatCard } from '@/components/stat-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CategoryDonut,
  IncomeExpenseAreaChart,
} from '@/components/charts';
import { QuickAddForm } from '@/components/quick-add-form';
import { TransactionsTable } from '@/components/transactions-table';
import { EmptyState } from '@/components/ui/empty-state';
import { FullPageSpinner } from '@/components/ui/spinner';
import type {
  ByCategoryResponse,
  Category,
  OverviewResponse,
  PaginatedTransactions,
  TrendResponse,
} from '@/lib/types';

export default function OverviewPage() {
  const [overview, setOverview] = React.useState<OverviewResponse | null>(null);
  const [trend, setTrend] = React.useState<TrendResponse | null>(null);
  const [byCat, setByCat] = React.useState<ByCategoryResponse | null>(null);
  const [recent, setRecent] = React.useState<PaginatedTransactions | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 29);

      const [ov, tr, bc, rc, cats] = await Promise.all([
        api.analytics.overview('month'),
        api.analytics.trend('custom', isoDate(start), isoDate(today)),
        api.analytics.byCategory('month', undefined, undefined, 'EXPENSE'),
        api.transactions.list({ pageSize: 10, page: 1 }),
        api.categories.list(),
      ]);
      setOverview(ov);
      setTrend(tr);
      setByCat(bc);
      setRecent(rc);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) return <FullPageSpinner />;

  const isEmpty =
    (overview?.income.total ?? 0) === 0 &&
    (overview?.expense.total ?? 0) === 0 &&
    (recent?.total ?? 0) === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-[22px] font-medium">{STRINGS.nav.overview}</h1>
        </header>
        <Card>
          <EmptyState
            title={STRINGS.overview.emptyTitle}
            subtitle={STRINGS.overview.emptySubtitle}
          />
        </Card>
        <QuickAddForm categories={categories} onCreated={load} />
      </div>
    );
  }

  const donutData = (byCat?.items ?? [])
    .slice(0, 6)
    .map((i) => ({ name: i.name, value: i.total, color: i.color }));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-medium">{STRINGS.nav.overview}</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={STRINGS.overview.income}
          amount={overview?.income.total ?? 0}
          change={overview?.income.change ?? 0}
          tone="success"
          icon={<ArrowUpRight className="h-4 w-4 text-success" />}
        />
        <StatCard
          label={STRINGS.overview.expense}
          amount={overview?.expense.total ?? 0}
          change={overview?.expense.change ?? 0}
          tone="danger"
          invertChange
          icon={<ArrowDownRight className="h-4 w-4 text-danger" />}
        />
        <StatCard
          label={STRINGS.overview.net}
          amount={overview?.net.total ?? 0}
          change={overview?.net.change ?? 0}
          tone={(overview?.net.total ?? 0) >= 0 ? 'success' : 'danger'}
          icon={<Wallet className="h-4 w-4 text-muted" />}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{STRINGS.overview.incomeVsExpense}</CardTitle>
            <span className="text-[11.5px] text-muted">30 kun</span>
          </CardHeader>
          <IncomeExpenseAreaChart data={trend?.points ?? []} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{STRINGS.overview.topCategories}</CardTitle>
          </CardHeader>
          <CategoryDonut data={donutData} />
        </Card>
      </section>

      <QuickAddForm categories={categories} onCreated={load} />

      <Card>
        <CardHeader>
          <CardTitle>{STRINGS.overview.recent}</CardTitle>
        </CardHeader>
        <TransactionsTable
          rows={recent?.items ?? []}
          categories={categories}
          onChanged={load}
        />
      </Card>
    </div>
  );
}
