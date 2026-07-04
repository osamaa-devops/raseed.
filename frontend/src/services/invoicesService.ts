import type { Invoice, Payment } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type InvoiceListParams = {
  branchId?: string;
  cashierId?: string;
  shiftId?: string;
  customerId?: string;
  paymentMethod?: Payment["method"] | "";
  status?: Invoice["status"] | "";
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

export const invoicesService = {
  getInvoices: (params: InvoiceListParams = {}) =>
    apiRequest<ListResponse<Invoice>>(`/invoices${toQuery(params)}`),
  getInvoice: (id: string) => apiRequest<Invoice>(`/invoices/${id}`),
  getInvoiceByNumber: (invoiceNumber: string) => apiRequest<Invoice>(`/invoices/by-number/${invoiceNumber}`),
};
