import type {
  AddDebtRequest,
  AdjustDebtRequest,
  CreateCustomerRequest,
  Customer,
  CustomerDebtTransaction,
  CustomerStatus,
  PayDebtRequest,
  UpdateCustomerRequest,
} from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type CustomerListParams = {
  search?: string;
  status?: CustomerStatus | "";
  hasDebt?: "true" | "false" | "";
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

export const customersService = {
  getCustomers: (params: CustomerListParams = {}) =>
    apiRequest<ListResponse<Customer> & { summary: { totalDebt: number; customersCount: number } }>(`/customers${toQuery(params)}`),
  getCustomer: (id: string) => apiRequest<Customer>(`/customers/${id}`),
  createCustomer: (payload: CreateCustomerRequest) => apiRequest<Customer>("/customers", { method: "POST", body: JSON.stringify(payload) }),
  updateCustomer: (id: string, payload: UpdateCustomerRequest) => apiRequest<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateCustomerStatus: (id: string, status: CustomerStatus) => apiRequest<Customer>(`/customers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteCustomer: (id: string) => apiRequest<{ success: boolean }>(`/customers/${id}`, { method: "DELETE" }),
  getDebtTransactions: (id: string, params: { branchId?: string } = {}) =>
    apiRequest<{ items: CustomerDebtTransaction[] }>(`/customers/${id}/debt-transactions${toQuery(params)}`),
  addDebt: (id: string, payload: AddDebtRequest) => apiRequest<CustomerDebtTransaction>(`/customers/${id}/debt/add`, { method: "POST", body: JSON.stringify(payload) }),
  payDebt: (id: string, payload: PayDebtRequest) => apiRequest<CustomerDebtTransaction>(`/customers/${id}/debt/payment`, { method: "POST", body: JSON.stringify(payload) }),
  adjustDebt: (id: string, payload: AdjustDebtRequest) => apiRequest<CustomerDebtTransaction>(`/customers/${id}/debt/adjust`, { method: "POST", body: JSON.stringify(payload) }),
};
