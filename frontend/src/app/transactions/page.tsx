'use client';

import * as React from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TransactionsTable } from '@/components/transactions-table';
import { FullPageSpinner, Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { isoDate } from '@/lib/utils';
import { STRINGS } from '@/constants/strings';
import type {
  Category,
  PaginatedTransactions,
  TxType,
} from '@/lib/types';

export default function TransactionsPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [data, setData] = React.useState<PaginatedTransactions | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [type, setType] = React.useState<'' | TxType>('');
  const [categoryId, setCategoryId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const load = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.transactions.list({
        type: type || undefined,
        categoryId: categoryId || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate
          ? new Date(endDate + 'T23:59:59').toISOString()
          : undefined,
        search: search || undefined,
        page,
        pageSize,
      });
      setData(res);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [type, categoryId, startDate, endDate, search, page]);

  React.useEffect(() => {
    api.categories.list().then(setCategories);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    if (!data) return;
    const header = ['Date', 'Type', 'Category', 'Amount', 'Note', 'Source'];
    const rows = data.items.map((t) => [
      isoDate(new Date(t.date)),
      t.type,
      t.category.name,
      String(t.amount),
      (t.note ?? '').replace(/"/g, '""'),
      t.source,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${isoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setType('');
    setCategoryId('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-[22px] font-medium">
          {STRINGS.transactions.title}
        </h1>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          {STRINGS.transactions.export}
        </Button>
      </header>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder={STRINGS.common.search}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <Select
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value as TxType | '');
            }}
          >
            <option value="">{STRINGS.common.all} turlar</option>
            <option value="INCOME">{STRINGS.common.income}</option>
            <option value="EXPENSE">{STRINGS.common.expense}</option>
          </Select>
          <Select
            value={categoryId}
            onChange={(e) => {
              setPage(1);
              setCategoryId(e.target.value);
            }}
          >
            <option value="">{STRINGS.common.all} kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setPage(1);
              setStartDate(e.target.value);
            }}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setPage(1);
              setEndDate(e.target.value);
            }}
          />
        </div>
        {(type || categoryId || startDate || endDate || search) && (
          <button
            onClick={resetFilters}
            className="mt-3 text-[12px] text-accent hover:underline"
          >
            Filtrlarni tozalash
          </button>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12.5px] text-muted">
            {data?.total ?? 0} ta tranzaksiya
          </p>
          {refreshing && <Spinner className="text-accent" />}
        </div>
        <TransactionsTable
          rows={data?.items ?? []}
          categories={categories}
          onChanged={load}
          inlineEdit
        />
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11.5px] text-muted">
              {data.page} / {data.totalPages} sahifa
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPage((p) => (data && p < data.totalPages ? p + 1 : p))
                }
                disabled={data.page >= data.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
