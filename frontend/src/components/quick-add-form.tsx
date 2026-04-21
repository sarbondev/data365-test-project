'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Card } from './ui/card';
import { useToast } from './ui/toast';
import { api } from '@/lib/api';
import { isoDate } from '@/lib/utils';
import { useTranslation } from '@/contexts/i18n-context';
import type { Category, TxType } from '@/lib/types';

interface QuickAddFormProps {
  categories: Category[];
  onCreated?: () => void;
  highlight?: boolean;
}

export function QuickAddForm({
  categories,
  onCreated,
}: QuickAddFormProps) {
  const toast = useToast();
  const { t } = useTranslation();
  const [type, setType] = React.useState<TxType>('EXPENSE');
  const [amount, setAmount] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [date, setDate] = React.useState(isoDate(new Date()));
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const filtered = React.useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  React.useEffect(() => {
    if (filtered.length > 0 && !filtered.find((c) => c.id === categoryId)) {
      setCategoryId(filtered[0].id);
    }
  }, [filtered, categoryId]);

  const reset = () => {
    setAmount('');
    setNote('');
    setDate(isoDate(new Date()));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount.replace(/\s|,/g, ''));
    if (!amt || amt <= 0) {
      toast.error(t('toasts.error'));
      return;
    }
    if (!categoryId) {
      toast.error(t('transactions.categoryRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await api.transactions.create({
        type,
        amount: amt,
        categoryId,
        note: note || undefined,
        date: new Date(date).toISOString(),
      });
      toast.success(t('toasts.saved'));
      reset();
      onCreated?.();
    } catch (e) {
      toast.error((e as Error).message || t('toasts.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-medium">{t('overview.quickAdd')}</h3>
          <div className="inline-flex border border-border rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={
                'px-3 h-8 text-[12px] font-medium transition-colors ' +
                (type === 'INCOME'
                  ? 'bg-success text-white'
                  : 'bg-surface text-muted hover:bg-surfaceAlt')
              }
            >
              {t('common.income')}
            </button>
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={
                'px-3 h-8 text-[12px] font-medium border-l border-border transition-colors ' +
                (type === 'EXPENSE'
                  ? 'bg-danger text-white'
                  : 'bg-surface text-muted hover:bg-surfaceAlt')
              }
            >
              {t('common.expense')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11.5px] text-muted mb-1.5">
              {t('transactions.amountLabel')}
            </label>
            <Input
              inputMode="decimal"
              placeholder="2,500,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[11.5px] text-muted mb-1.5">
              {t('common.category')}
            </label>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ''}
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-[11.5px] text-muted mb-1.5">
              {t('common.date')}
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[11.5px] text-muted mb-1.5">
              {t('common.note')}
            </label>
            <Input
              placeholder={t('transactions.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>

        <Button type="submit" loading={submitting}>
          {t('common.add')}
        </Button>
      </form>
    </Card>
  );
}
