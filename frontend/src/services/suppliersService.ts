import type { CreateSupplierRequest, Supplier, SupplierAdjustRequest, SupplierPaymentRequest, SupplierStatus, SupplierTransaction, UpdateSupplierRequest } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type SupplierListParams = {
  search?: string;
  status?: SupplierStatus | "";
  hasBalance?: "true" | "false" | "";
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

export const suppliersService = {
  getSuppliers: (params: SupplierListParams = {}) =>
    apiRequest<ListResponse<Supplier> & { summary: { totalBalance: number; suppliersCount: number } }>(`/suppliers${toQuery(params)}`),
  getSupplier: (id: string) => apiRequest<Supplier>(`/suppliers/${id}`),
  createSupplier: (payload: CreateSupplierRequest) => apiRequest<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(payload) }),
  updateSupplier: (id: string, payload: UpdateSupplierRequest) => apiRequest<Supplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateSupplierStatus: (id: string, status: SupplierStatus) => apiRequest<Supplier>(`/suppliers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteSupplier: (id: string) => apiRequest<{ success: boolean }>(`/suppliers/${id}`, { method: "DELETE" }),
  getSupplierTransactions: (id: string, params: { branchId?: string } = {}) =>
    apiRequest<{ items: SupplierTransaction[] }>(`/suppliers/${id}/transactions${toQuery(params)}`),
  makeSupplierPayment: (id: string, payload: SupplierPaymentRequest) =>
    apiRequest<SupplierTransaction>(`/suppliers/${id}/payment`, { method: "POST", body: JSON.stringify(payload) }),
  adjustSupplierBalance: (id: string, payload: SupplierAdjustRequest) =>
    apiRequest<SupplierTransaction>(`/suppliers/${id}/adjust`, { method: "POST", body: JSON.stringify(payload) }),
};
