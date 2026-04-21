'use client';

import * as React from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { ConfirmDialog } from './ui/dialog';
import { useToast } from './ui/toast';
import { formatDate, formatUZS, isoDate } from '@/lib/utils';
import { useTranslation } from '@/contexts/i18n-context';
import { api } from '@/lib/api';
import type { Category, Source, Transaction } from '@/lib/types';

interface Props {
  rows: Transaction[];
  categories: Category[];
  onChanged?: () => void;
  inlineEdit?: boolean;
  showSource?: boolean;
}

const SOURCE_LABEL: Record<Source, string> = {
  DASHBOARD: 'Dashboard',
  TELEGRAM: 'Telegram',
};

export function TransactionsTable({
  rows,
  categories,
  onChanged,
  inlineEdit = false,
  showSource = true,
}: Props) {
  const toast = useToast();
  const { t } = useTranslation();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Partial<Transaction>>({});
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    setBusyId(deleteId);
    try {
      await api.transactions.delete(deleteId);
      toast.success(t('toasts.deleted'));
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message || t('toasts.error'));
    } finally {
      setBusyId(null);
      setDeleteId(null);
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setDraft({
      amount: tx.amount,
      categoryId: tx.categoryId,
      note: tx.note,
      date: tx.date,
      type: tx.type,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = async (id: string) => {
    setBusyId(id);
    try {
      await api.transactions.update(id, {
        amount: draft.amount ? Number(draft.amount) : undefined,
        categoryId: draft.categoryId,
        note: draft.note ?? undefined,
        date: draft.date ? new Date(draft.date).toISOString() : undefined,
        type: draft.type,
      });
      toast.success(t('toasts.updated'));
      setEditingId(null);
      setDraft({});
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message || t('toasts.error'));
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-[13px] text-muted">
        {t('transactions.empty')}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-borderSoft">
              <th className="px-5 py-2.5 font-medium">{t('common.date')}</th>
              <th className="px-3 py-2.5 font-medium">{t('common.type')}</th>
              <th className="px-3 py-2.5 font-medium">{t('common.category')}</th>
              <th className="px-3 py-2.5 font-medium text-right">{t('common.amount')}</th>
              <th className="px-3 py-2.5 font-medium">{t('common.note')}</th>
              {showSource && <th className="px-3 py-2.5 font-medium">{t('common.source')}</th>}
              <th className="px-5 py-2.5 font-medium text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => {
              const editing = editingId === tx.id;
              const cat = categories.find(
                (c) => c.id === (editing ? draft.categoryId ?? tx.categoryId : tx.categoryId),
              );
              return (
                <tr
                  key={tx.id}
                  className="border-b border-borderSoft hover:bg-surfaceAlt/50 transition-colors"
                >
                  <td className="px-5 py-3 text-muted whitespace-nowrap tabular">
                    {editing ? (
                      <Input
                        type="date"
                        className="h-8"
                        value={
                          draft.date
                            ? isoDate(new Date(draft.date))
                            : isoDate(new Date(tx.date))
                        }
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            date: new Date(e.target.value).toISOString(),
                          }))
                        }
                      />
                    ) : (
                      formatDate(tx.date)
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={tx.type === 'INCOME' ? 'income' : 'expense'}>
                      {tx.type === 'INCOME'
                        ? t('common.income')
                        : t('common.expense')}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    {editing ? (
                      <Select
                        className="h-8"
                        value={draft.categoryId ?? tx.categoryId}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, categoryId: e.target.value }))
                        }
                      >
                        {categories
                          .filter((c) => c.type === tx.type)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon ? `${c.icon} ` : ''}
                              {c.name}
                            </option>
                          ))}
                      </Select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: cat?.color ?? '#9E9E9E' }}
                        />
                        {cat?.name ?? '—'}
                      </span>
                    )}
                  </td>
                  <td
                    className={
                      'px-3 py-3 text-right font-medium whitespace-nowrap tabular ' +
                      (tx.type === 'INCOME' ? 'text-success' : 'text-danger')
                    }
                  >
                    {editing ? (
                      <Input
                        className="h-8 text-right"
                        inputMode="decimal"
                        value={String(draft.amount ?? tx.amount)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            amount: Number(e.target.value.replace(/\s|,/g, '')) || 0,
                          }))
                        }
                      />
                    ) : (
                      <>
                        {tx.type === 'INCOME' ? '+' : '−'}
                        {formatUZS(tx.amount)}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted max-w-xs truncate">
                    {editing ? (
                      <Input
                        className="h-8"
                        value={draft.note ?? tx.note ?? ''}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, note: e.target.value }))
                        }
                      />
                    ) : (
                      tx.note ?? '—'
                    )}
                  </td>
                  {showSource && (
                    <td className="px-3 py-3">
                      <Badge variant="neutral">{SOURCE_LABEL[tx.source]}</Badge>
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      {editing ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveEdit(tx.id)}
                            loading={busyId === tx.id}
                            aria-label="save"
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEdit}
                            aria-label="cancel"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {inlineEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEdit(tx)}
                              aria-label="edit"
                            >
                              <Pencil className="h-4 w-4 text-muted" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(tx.id)}
                            aria-label="delete"
                          >
                            <Trash2 className="h-4 w-4 text-muted" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title={t('transactions.deleteConfirm')}
        confirmText={t('common.delete')}
        destructive
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
