import type { SubscriptionPayment, SubscriptionPaymentMethod, SubscriptionPaymentStatus } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const subscriptionPaymentsService = {
  getPayments: (params: { storeId?: string; subscriptionId?: string; status?: SubscriptionPaymentStatus | ""; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}) =>
    apiRequest<ListResponse<SubscriptionPayment>>(`/admin/subscription-payments${toQuery(params)}`),
  createPayment: (payload: { storeId: string; subscriptionId: string; amount: number; method: SubscriptionPaymentMethod; status: SubscriptionPaymentStatus; paidAt?: string; reference?: string; notes?: string }) =>
    apiRequest<SubscriptionPayment>("/admin/subscription-payments", { method: "POST", body: JSON.stringify(payload) }),
};
