import type { ClosingSummary, DailyClosing } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const closingService = {
  getClosingSummary: (params: { branchId: string; date?: string }) => apiRequest<ClosingSummary>(`/closing/summary${toQuery(params)}`),
  closeDay: (payload: { branchId: string; date?: string; actualCash: number; notes?: string }) =>
    apiRequest<DailyClosing>("/closing/close-day", { method: "POST", body: JSON.stringify(payload) }),
  getClosingHistory: (params: { branchId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}) =>
    apiRequest<ListResponse<DailyClosing>>(`/closing/history${toQuery(params)}`),
};
