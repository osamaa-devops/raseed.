import type { CashierShift } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type ShiftListParams = {
  branchId?: string;
  cashierId?: string;
  status?: CashierShift["status"] | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const shiftsService = {
  getCurrentShift: (branchId?: string) => apiRequest<CashierShift | null>(`/shifts/current${toQuery({ branchId })}`),
  openShift: (payload: { branchId: string; openingCash: number; notes?: string }) =>
    apiRequest<CashierShift>("/shifts/open", { method: "POST", body: JSON.stringify(payload) }),
  closeShift: (payload: { shiftId: string; actualCash: number; notes?: string }) =>
    apiRequest<CashierShift>("/shifts/close", { method: "POST", body: JSON.stringify(payload) }),
  getShifts: (params: ShiftListParams = {}) => apiRequest<ListResponse<CashierShift>>(`/shifts${toQuery(params)}`),
};
