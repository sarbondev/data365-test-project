import { Transaction, Category, Locale, Type } from '@prisma/client';
import { botMessages } from './bot.constants';

const MONTHS: Record<Locale, string[]> = {
  uz: [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ],
  ru: [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ],
};

const SHORT_MONTHS: Record<Locale, string[]> = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
};

const CURRENCY: Record<Locale, string> = { uz: "so'm", ru: 'сум' };

const SAVED_LABEL: Record<Locale, string> = {
  uz: 'saqlandi',
  ru: 'сохранён',
};

const FIELD_LABELS: Record<Locale, { amount: string; category: string; date: string; note: string }> = {
  uz: { amount: 'Summa', category: 'Kategoriya', date: 'Sana', note: 'Izoh' },
  ru: { amount: 'Сумма', category: 'Категория', date: 'Дата', note: 'Заметка' },
};

const BUDGET_STRINGS: Record<
  Locale,
  {
    warningTitle: string;
    spentLabel: string;
    remainingLabel: string;
    periodSuffix: string;
    exceededTitle: string;
    limitReached: (cat: string, budget: string, currency: string) => string;
    exceededSubtitle: string;
    percentSpent: string;
  }
> = {
  uz: {
    warningTitle: '⚠️ Byudjet ogohlantirishi',
    spentLabel: 'sarflandi',
    remainingLabel: 'Qolgan',
    periodSuffix: 'bu oy',
    exceededTitle: '🚨 Byudjet tugadi!',
    limitReached: (cat, budget, currency) =>
      `📂 ${cat} uchun oylik limit to'ldi: ${budget} ${currency}`,
    exceededSubtitle: 'Yangi xarajat limitdan oshib ketdi.',
    percentSpent: 'sarflandi',
  },
  ru: {
    warningTitle: '⚠️ Предупреждение о бюджете',
    spentLabel: 'потрачено',
    remainingLabel: 'Остаток',
    periodSuffix: 'в этом месяце',
    exceededTitle: '🚨 Бюджет исчерпан!',
    limitReached: (cat, budget, currency) =>
      `📂 Месячный лимит по "${cat}" достигнут: ${budget} ${currency}`,
    exceededSubtitle: 'Новый расход превысил лимит.',
    percentSpent: 'потрачено',
  },
};

export function formatAmount(amount: number): string {
  return Math.round(amount).toLocaleString('en-US');
}

export function formatUzDate(date: Date, locale: Locale = 'uz'): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS[locale][d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(date: Date, locale: Locale = 'uz'): string {
  const d = new Date(date);
  return `${d.getDate()} ${SHORT_MONTHS[locale][d.getMonth()]}`;
}

export function currency(locale: Locale): string {
  return CURRENCY[locale];
}

export function txConfirmationMessage(
  tx: Transaction & { category: Category },
  locale: Locale,
): string {
  const msg = botMessages(locale);
  const verb = tx.type === 'INCOME' ? msg.INCOME_VERB : msg.EXPENSE_VERB;
  const labels = FIELD_LABELS[locale];
  const cur = CURRENCY[locale];
  const lines = [
    `✅ ${verb} ${SAVED_LABEL[locale]}`,
    '',
    `💰 ${labels.amount}: ${formatAmount(tx.amount)} ${cur}`,
    `📂 ${labels.category}: ${tx.category.icon ? tx.category.icon + ' ' : ''}${tx.category.name}`,
    `📅 ${labels.date}: ${formatUzDate(tx.date, locale)}`,
  ];
  if (tx.note) lines.push(`📝 ${labels.note}: ${tx.note}`);
  return lines.join('\n');
}

export function categoryPickerMessage(type: Type, locale: Locale): string {
  const msg = botMessages(locale);
  return type === 'INCOME' ? msg.CATEGORY_PICK_INCOME : msg.CATEGORY_PICK_EXPENSE;
}

export function budgetWarningMessage(
  category: Category,
  spent: number,
  budget: number,
  locale: Locale,
): string {
  const remaining = Math.max(0, budget - spent);
  const s = BUDGET_STRINGS[locale];
  const cur = CURRENCY[locale];
  return [
    s.warningTitle,
    '',
    `📂 ${category.name} — 80% ${s.percentSpent}`,
    `💸 ${formatAmount(spent)} / ${formatAmount(budget)} ${cur}`,
    `📊 ${s.remainingLabel}: ${formatAmount(remaining)} ${cur} (${s.periodSuffix})`,
  ].join('\n');
}

export function budgetExceededMessage(
  category: Category,
  budget: number,
  locale: Locale,
): string {
  const s = BUDGET_STRINGS[locale];
  const cur = CURRENCY[locale];
  return [
    s.exceededTitle,
    '',
    s.limitReached(category.name, formatAmount(budget), cur),
    s.exceededSubtitle,
  ].join('\n');
}
