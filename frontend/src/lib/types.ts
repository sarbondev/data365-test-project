export type TxType = 'INCOME' | 'EXPENSE';
export type Source = 'DASHBOARD' | 'TELEGRAM';
export type Period = 'week' | 'month' | 'last-month' | 'custom';

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string;
  icon: string | null;
  isDefault: boolean;
  budget: number | null;
  createdAt: string;
  transactionCount?: number;
  monthlyTotal?: number;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  category: Category;
  note: string | null;
  date: string;
  source: Source;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SummaryBlock {
  total: number;
  count?: number;
  change: number;
}

export interface OverviewResponse {
  period: { start: string; end: string };
  income: SummaryBlock;
  expense: SummaryBlock;
  net: SummaryBlock;
  stats?: {
    avgDailyExpense: number;
    biggestExpense: {
      id: string;
      amount: number;
      date: string;
      note: string | null;
      category: string;
    } | null;
    mostActiveCategory: { id: string; name: string; count: number } | null;
  };
}

export interface ByCategoryItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  type: TxType;
  total: number;
  count: number;
}

export interface ByCategoryResponse {
  period: { start: string; end: string };
  items: ByCategoryItem[];
}

export interface TrendPoint {
  date: string;
  income: number;
  expense: number;
}

export interface TrendResponse {
  period: { start: string; end: string };
  points: TrendPoint[];
}

export interface BudgetItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  budget: number;
  spent: number;
  remaining: number;
  usage: number;
  status: 'OK' | 'WARNING' | 'EXCEEDED';
}

export interface BudgetResponse {
  period: { start: string; end: string };
  items: BudgetItem[];
}
