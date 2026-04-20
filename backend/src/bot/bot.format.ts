import { Transaction, Category, Type } from '@prisma/client';

const UZ_MONTHS = [
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
];

export function formatAmount(amount: number): string {
  return Math.round(amount).toLocaleString('en-US').replace(/,/g, ',');
}

export function formatUzDate(date: Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function txConfirmationMessage(
  tx: Transaction & { category: Category },
): string {
  const verb = tx.type === 'INCOME' ? 'Kirim' : 'Xarajat';
  const icon = tx.type === 'INCOME' ? '✅' : '✅';
  const lines = [
    `${icon} ${verb} saqlandi`,
    '',
    `💰 Summa: ${formatAmount(tx.amount)} so'm`,
    `📂 Kategoriya: ${tx.category.icon ? tx.category.icon + ' ' : ''}${tx.category.name}`,
    `📅 Sana: ${formatUzDate(tx.date)}`,
  ];
  if (tx.note) lines.push(`📝 Izoh: ${tx.note}`);
  return lines.join('\n');
}

export function categoryPickerMessage(type: Type): string {
  return type === 'INCOME'
    ? '❓ Kirim kategoriyasini tanlang:'
    : '❓ Xarajat kategoriyasini tanlang:';
}

export function budgetWarningMessage(
  category: Category,
  spent: number,
  budget: number,
): string {
  const remaining = Math.max(0, budget - spent);
  return [
    '⚠️ Byudjet ogohlantirishи',
    '',
    `📂 ${category.name} — 80% sarflandi`,
    `💸 ${formatAmount(spent)} / ${formatAmount(budget)} so'm`,
    `📊 Qolgan: ${formatAmount(remaining)} so'm (bu oy)`,
  ].join('\n');
}

export function budgetExceededMessage(
  category: Category,
  budget: number,
): string {
  return [
    '🚨 Byudjet tugadi!',
    '',
    `📂 ${category.name} uchun oylik limit to'ldi: ${formatAmount(budget)} so'm`,
    'Yangi xarajat limitdan oshib ketdi.',
  ].join('\n');
}
