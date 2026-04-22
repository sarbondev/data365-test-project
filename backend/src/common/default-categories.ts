import { Type } from '@prisma/client';

export interface DefaultCategory {
  name: string;
  nameRu: string;
  type: Type;
  color: string;
  icon: string;
}

export const defaultCategories: DefaultCategory[] = [
  // INCOME
  { name: 'Savdo',       nameRu: 'Продажи',      type: 'INCOME',  color: '#10B981', icon: '💼' },
  { name: 'Xizmat',      nameRu: 'Услуги',        type: 'INCOME',  color: '#3B82F6', icon: '🛠️' },
  { name: 'Investitsiya',nameRu: 'Инвестиции',    type: 'INCOME',  color: '#8B5CF6', icon: '📈' },
  { name: 'Boshqa',      nameRu: 'Прочее',        type: 'INCOME',  color: '#64748B', icon: '📦' },
  // EXPENSE
  { name: 'Ijara',       nameRu: 'Аренда',        type: 'EXPENSE', color: '#F59E0B', icon: '🏢' },
  { name: 'Logistika',   nameRu: 'Логистика',     type: 'EXPENSE', color: '#EF4444', icon: '🚚' },
  { name: 'Maosh',       nameRu: 'Зарплата',      type: 'EXPENSE', color: '#EC4899', icon: '👥' },
  { name: 'Marketing',   nameRu: 'Маркетинг',     type: 'EXPENSE', color: '#06B6D4', icon: '📣' },
  { name: 'Kommunal',    nameRu: 'Коммунальные',  type: 'EXPENSE', color: '#84CC16', icon: '💡' },
  { name: 'Boshqa',      nameRu: 'Прочее',        type: 'EXPENSE', color: '#64748B', icon: '📦' },
];

/** @deprecated kept for backwards compat — use defaultCategories directly */
export function defaultCategoriesFor(_locale: unknown): DefaultCategory[] {
  return defaultCategories;
}
