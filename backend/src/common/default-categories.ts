import { Type } from '@prisma/client';

export interface DefaultCategory {
  name: string;
  type: Type;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
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
