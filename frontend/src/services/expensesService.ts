import type { Expense, ExpenseCategory } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type ExpenseListParams = {
  branchId?: string;
  category?: ExpenseCategory | "";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type ExpensePayload = {
  branchId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate?: string;
  notes?: string | null;
  attachmentUrl?: string | null;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const expensesService = {
  getExpenses: (params: ExpenseListParams = {}) =>
    apiRequest<ListResponse<Expense> & { summary: { today: number; month: number; topCategory: { category: ExpenseCategory; amount: number } | null } }>(`/expenses${toQuery(params)}`),
  getExpense: (id: string) => apiRequest<Expense>(`/expenses/${id}`),
  createExpense: (payload: ExpensePayload) => apiRequest<Expense>("/expenses", { method: "POST", body: JSON.stringify(payload) }),
  updateExpense: (id: string, payload: Partial<ExpensePayload>) => apiRequest<Expense>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteExpense: (id: string) => apiRequest<{ success: boolean }>(`/expenses/${id}`, { method: "DELETE" }),
};
