import type { CreatePurchaseOrderRequest, PurchaseOrder, PurchaseOrderStatus, ReceivePurchaseOrderRequest, UpdatePurchaseOrderRequest } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type PurchaseOrderListParams = {
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus | "";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const purchaseOrdersService = {
  getPurchaseOrders: (params: PurchaseOrderListParams = {}) =>
    apiRequest<ListResponse<PurchaseOrder> & { summary: { total: number; paidAmount: number; remainingAmount: number } }>(`/purchase-orders${toQuery(params)}`),
  getPurchaseOrder: (id: string) => apiRequest<PurchaseOrder>(`/purchase-orders/${id}`),
  createPurchaseOrder: (payload: CreatePurchaseOrderRequest) => apiRequest<PurchaseOrder>("/purchase-orders", { method: "POST", body: JSON.stringify(payload) }),
  updatePurchaseOrder: (id: string, payload: UpdatePurchaseOrderRequest) => apiRequest<PurchaseOrder>(`/purchase-orders/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) =>
    apiRequest<PurchaseOrder>(`/purchase-orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  receivePurchaseOrder: (id: string, payload: ReceivePurchaseOrderRequest) =>
    apiRequest<PurchaseOrder>(`/purchase-orders/${id}/receive`, { method: "POST", body: JSON.stringify(payload) }),
  deletePurchaseOrder: (id: string) => apiRequest<{ success: boolean }>(`/purchase-orders/${id}`, { method: "DELETE" }),
};
