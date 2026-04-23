import type {
  ApiResponse,
  AuthUser,
  BudgetResponse,
  ByCategoryResponse,
  Category,
  Locale,
  OverviewResponse,
  PaginatedTransactions,
  Period,
  Transaction,
  TrendResponse,
  TxType,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | number | undefined | null> },
): Promise<T> {
  const url = new URL(path, API_BASE);
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('Invalid server response', res.status);
  }

  if (!res.ok || !body.success) {
    throw new ApiError(body?.message ?? 'Request failed', res.status);
  }

  return body.data;
}

export interface TransactionFilters {
  type?: TxType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | undefined;
}

export interface CreateTransactionInput {
  type: TxType;
  amount: number;
  categoryId: string;
  note?: string;
  date?: string;
}

export interface UpdateTransactionInput {
  type?: TxType;
  amount?: number;
  categoryId?: string;
  note?: string | null;
  date?: string;
}

export interface CreateCategoryInput {
  name: string;
  nameRu?: string;
  type: TxType;
  color: string;
  icon?: string;
  budget?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  nameRu?: string | null;
  color?: string;
  icon?: string;
  budget?: number | null;
}

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  locale?: Locale;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export const api = {
  auth: {
    register: (input: RegisterInput) =>
      request<AuthUser>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    login: (input: LoginInput) =>
      request<AuthUser>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => request<AuthUser>('/auth/me'),
    updateLocale: (locale: Locale) =>
      request<AuthUser>('/auth/locale', {
        method: 'PATCH',
        body: JSON.stringify({ locale }),
      }),
  },
  transactions: {
    list: (filters: TransactionFilters = {}) =>
      request<PaginatedTransactions>('/transactions', { query: filters }),
    summary: (startDate?: string, endDate?: string) =>
      request<OverviewResponse>('/transactions/summary', {
        query: { startDate, endDate },
      }),
    create: (input: CreateTransactionInput) =>
      request<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (id: string, input: UpdateTransactionInput) =>
      request<Transaction>(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    delete: (id: string) =>
      request<{ id: string }>(`/transactions/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: (type?: TxType) =>
      request<Category[]>('/categories', { query: { type } }),
    create: (input: CreateCategoryInput) =>
      request<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (id: string, input: UpdateCategoryInput) =>
      request<Category>(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    delete: (id: string) =>
      request<{ id: string }>(`/categories/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    overview: (period?: Period, startDate?: string, endDate?: string) =>
      request<OverviewResponse>('/analytics/overview', {
        query: { period, startDate, endDate },
      }),
    byCategory: (
      period?: Period,
      startDate?: string,
      endDate?: string,
      type?: TxType,
    ) =>
      request<ByCategoryResponse>('/analytics/by-category', {
        query: { period, startDate, endDate, type },
      }),
    trend: (period?: Period, startDate?: string, endDate?: string) =>
      request<TrendResponse>('/analytics/trend', {
        query: { period, startDate, endDate },
      }),
    budget: () => request<BudgetResponse>('/analytics/budget-status'),
  },
};

export { ApiError };
