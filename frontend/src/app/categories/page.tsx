'use client';

import * as React from 'react';
import { Lock, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/dialog';
import { FullPageSpinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { STRINGS } from '@/constants/strings';
import type { Category, TxType } from '@/lib/types';

const COLORS = [
  '#1976D2',
  '#2E7D32',
  '#ED6C02',
  '#9C27B0',
  '#C62828',
  '#0097A7',
  '#5D4037',
  '#455A64',
  '#F57C00',
  '#6A1B9A',
];

const ICONS = ['💼', '🛠️', '📈', '📦', '🏢', '🚚', '👥', '📣', '💡', '☕', '✈️', '🏪'];

export default function CategoriesPage() {
  const toast = useToast();
  const [cats, setCats] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const list = await api.categories.list();
    setCats(list);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.categories.delete(deleteId);
      toast.success(STRINGS.toasts.deleted);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <FullPageSpinner />;

  const income = cats.filter((c) => c.type === 'INCOME');
  const expense = cats.filter((c) => c.type === 'EXPENSE');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-medium">{STRINGS.categories.title}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryColumn
          title={STRINGS.categories.incomeCol}
          type="INCOME"
          cats={income}
          onChanged={load}
          onDelete={(id) => setDeleteId(id)}
        />
        <CategoryColumn
          title={STRINGS.categories.expenseCol}
          type="EXPENSE"
          cats={expense}
          onChanged={load}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Kategoriyani o'chirishni tasdiqlaysizmi?"
        confirmText={STRINGS.common.delete}
        destructive
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CategoryColumn({
  title,
  type,
  cats,
  onChanged,
  onDelete,
}: {
  title: string;
  type: TxType;
  cats: Category[];
  onChanged: () => void;
  onDelete: (id: string) => void;
}) {
  const toast = useToast();
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(COLORS[0]);
  const [icon, setIcon] = React.useState(ICONS[0]);
  const [budget, setBudget] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setName('');
    setColor(COLORS[0]);
    setIcon(ICONS[0]);
    setBudget('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.categories.create({
        name: name.trim(),
        type,
        color,
        icon,
        budget: budget ? Number(budget.replace(/\s|,/g, '')) : undefined,
      });
      toast.success(STRINGS.toasts.saved);
      reset();
      setAdding(false);
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-medium">{title}</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          {STRINGS.common.add}
        </Button>
      </div>

      {adding && (
        <form
          onSubmit={submit}
          className="mb-4 space-y-3 rounded border border-border bg-surfaceAlt/60 p-3"
        >
          <Input
            placeholder="Kategoriya nomi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
          />
          <div>
            <p className="text-[11.5px] text-muted mb-1.5">Rang</p>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={
                    'h-6 w-6 rounded-full border-2 transition ' +
                    (color === c ? 'border-foreground' : 'border-transparent')
                  }
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11.5px] text-muted mb-1.5">Belgi</p>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={
                    'h-8 w-8 rounded text-[15px] grid place-items-center transition border ' +
                    (icon === e
                      ? 'border-accent bg-accentSoft'
                      : 'border-border bg-surface hover:bg-surfaceAlt')
                  }
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input
            inputMode="decimal"
            placeholder="Oylik byudjet (ixtiyoriy, so'm)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={submitting} size="sm">
              {STRINGS.common.save}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                setAdding(false);
              }}
            >
              {STRINGS.common.cancel}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-1.5">
        {cats.length === 0 && (
          <p className="text-[13px] text-muted">Kategoriyalar yo'q</p>
        )}
        {cats.map((c) => (
          <CategoryRow
            key={c.id}
            cat={c}
            onChanged={onChanged}
            onDelete={() => onDelete(c.id)}
          />
        ))}
      </div>
    </Card>
  );
}

function CategoryRow({
  cat,
  onChanged,
  onDelete,
}: {
  cat: Category;
  onChanged: () => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(cat.name);
  const [color, setColor] = React.useState(cat.color);
  const [budget, setBudget] = React.useState(
    cat.budget ? String(cat.budget) : '',
  );
  const [busy, setBusy] = React.useState(false);

  const blocked = (cat.transactionCount ?? 0) > 0;

  const save = async () => {
    setBusy(true);
    try {
      await api.categories.update(cat.id, {
        name: name.trim(),
        color,
        budget: budget ? Number(budget.replace(/\s|,/g, '')) : null,
      });
      toast.success(STRINGS.toasts.updated);
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded border border-border bg-surfaceAlt/60 p-3 space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={
                'h-6 w-6 rounded-full border-2 ' +
                (color === c ? 'border-foreground' : 'border-transparent')
              }
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Input
          inputMode="decimal"
          placeholder="Oylik byudjet (so'm)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={save} loading={busy}>
            <Check className="h-3.5 w-3.5" />
            {STRINGS.common.save}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="h-3.5 w-3.5" />
            {STRINGS.common.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded px-3 py-2.5 hover:bg-surfaceAlt/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-8 w-8 rounded grid place-items-center text-[14px] shrink-0"
          style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
        >
          {cat.icon ?? '•'}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] flex items-center gap-1.5">
            {cat.name}
            {cat.isDefault && (
              <Lock className="h-3 w-3 text-faint" />
            )}
          </div>
          <div className="text-[11.5px] text-muted truncate mt-0.5">
            {cat.transactionCount ?? 0} {STRINGS.categories.txCount} ·{' '}
            {STRINGS.categories.monthTotal}: {formatUZS(cat.monthlyTotal ?? 0)}{' '}
            so'm
            {cat.budget ? (
              <>
                {' · '}
                <span>
                  {STRINGS.categories.budgetLabel}: {formatUZS(cat.budget)} so'm
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setEditing(true)}
          aria-label="edit"
        >
          <Pencil className="h-4 w-4 text-muted" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          disabled={cat.isDefault || blocked}
          aria-label="delete"
          title={
            cat.isDefault
              ? STRINGS.categories.defaultBadge
              : blocked
                ? `${cat.transactionCount} ${STRINGS.categories.blocked}`
                : STRINGS.common.delete
          }
        >
          <Trash2 className="h-4 w-4 text-muted" />
        </Button>
      </div>
    </div>
  );
}
