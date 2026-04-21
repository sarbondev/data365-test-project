import { Locale, Type } from '@prisma/client';

export interface DefaultCategory {
  name: string;
  type: Type;
  color: string;
  icon: string;
}

const uzCategories: DefaultCategory[] = [
  // INCOME
  { name: 'Savdo', type: 'INCOME', color: '#10B981', icon: '💼' },
  { name: 'Xizmat', type: 'INCOME', color: '#3B82F6', icon: '🛠️' },
  { name: 'Investitsiya', type: 'INCOME', color: '#8B5CF6', icon: '📈' },
  { name: 'Boshqa', type: 'INCOME', color: '#64748B', icon: '📦' },
  // EXPENSE
  { name: 'Ijara', type: 'EXPENSE', color: '#F59E0B', icon: '🏢' },
  { name: 'Logistika', type: 'EXPENSE', color: '#EF4444', icon: '🚚' },
  { name: 'Maosh', type: 'EXPENSE', color: '#EC4899', icon: '👥' },
  { name: 'Marketing', type: 'EXPENSE', color: '#06B6D4', icon: '📣' },
  { name: 'Kommunal', type: 'EXPENSE', color: '#84CC16', icon: '💡' },
  { name: 'Boshqa', type: 'EXPENSE', color: '#64748B', icon: '📦' },
];

const ruCategories: DefaultCategory[] = [
  // INCOME
  { name: 'Продажи', type: 'INCOME', color: '#10B981', icon: '💼' },
  { name: 'Услуги', type: 'INCOME', color: '#3B82F6', icon: '🛠️' },
  { name: 'Инвестиции', type: 'INCOME', color: '#8B5CF6', icon: '📈' },
  { name: 'Прочее', type: 'INCOME', color: '#64748B', icon: '📦' },
  // EXPENSE
  { name: 'Аренда', type: 'EXPENSE', color: '#F59E0B', icon: '🏢' },
  { name: 'Логистика', type: 'EXPENSE', color: '#EF4444', icon: '🚚' },
  { name: 'Зарплата', type: 'EXPENSE', color: '#EC4899', icon: '👥' },
  { name: 'Маркетинг', type: 'EXPENSE', color: '#06B6D4', icon: '📣' },
  { name: 'Коммунальные', type: 'EXPENSE', color: '#84CC16', icon: '💡' },
  { name: 'Прочее', type: 'EXPENSE', color: '#64748B', icon: '📦' },
];

export function defaultCategoriesFor(locale: Locale): DefaultCategory[] {
  return locale === 'ru' ? ruCategories : uzCategories;
}
