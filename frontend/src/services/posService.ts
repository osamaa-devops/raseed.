import type { CreateSaleRequest, HeldOrder, Invoice } from "../types";
import { apiRequest } from "./apiClient";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const posService = {
  createSale: (payload: CreateSaleRequest) =>
    apiRequest<Invoice>("/pos/sale", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRecentInvoices: (branchId?: string) =>
    apiRequest<Invoice[]>(`/pos/recent-invoices${toQuery({ branchId })}`),

  getHeldOrders: (branchId?: string) =>
    apiRequest<HeldOrder[]>(`/pos/held-orders${toQuery({ branchId })}`),

  createHeldOrder: (payload: { branchId: string; data: Record<string, unknown>; note?: string }) =>
    apiRequest<HeldOrder>("/pos/held-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteHeldOrder: (id: string) =>
    apiRequest<{ success: boolean }>(`/pos/held-orders/${id}`, { method: "DELETE" }),
};
