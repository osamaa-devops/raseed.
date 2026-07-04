import type { CreateReturnRequest, Return } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type ReturnListParams = {
  branchId?: string;
  cashierId?: string;
  invoiceId?: string;
  status?: Return["status"] | "";
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

export const returnsService = {
  getReturns: (params: ReturnListParams = {}) => apiRequest<ListResponse<Return>>(`/returns${toQuery(params)}`),
  getReturn: (id: string) => apiRequest<Return>(`/returns/${id}`),
  getReturnByNumber: (returnNumber: string) => apiRequest<Return>(`/returns/by-number/${returnNumber}`),
  createReturn: (payload: CreateReturnRequest) =>
    apiRequest<Return>("/returns", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
