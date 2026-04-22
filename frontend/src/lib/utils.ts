import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatUZS(amount: number): string {
  if (Number.isNaN(amount)) return '0';
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercent(n: number, fractionDigits = 1): string {
  if (!Number.isFinite(n)) return '0%';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(fractionDigits)}%`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getCategoryName(
  cat: { name: string; nameRu?: string | null },
  locale: string,
): string {
  return locale === 'ru' ? (cat.nameRu ?? cat.name) : cat.name;
}

export function startOfWeek(d = new Date()): Date {
  const day = d.getDay() || 7;
  const start = new Date(d);
  start.setDate(d.getDate() - (day - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}
