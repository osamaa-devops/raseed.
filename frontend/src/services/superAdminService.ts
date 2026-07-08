import type { AdminOverview, AdminStoreDetails, AdminStoreListItem, BillingCycle, StoreStatus, Subscription, SubscriptionStatus } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

type QueryValue = string | number | undefined;

function toQuery(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export type AdminStoresParams = {
  search?: string;
  status?: StoreStatus | "";
  planId?: string;
  subscriptionStatus?: SubscriptionStatus | "";
  page?: number;
  limit?: number;
};

export type CreateAdminStoreRequest = {
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  planId: string;
  billingCycle: BillingCycle;
  trialDays?: number;
  ownerUserName: string;
  ownerUserEmail?: string;
  ownerUserPhone: string;
  ownerPassword: string;
  cashierUserName?: string;
  cashierUserEmail?: string;
  cashierUserPhone?: string;
  cashierPassword?: string;
  mainBranchName: string;
  mainBranchAddress?: string;
};

export type AdminSubscriptionsParams = {
  status?: SubscriptionStatus | "";
  planId?: string;
  storeId?: string;
  expiringSoon?: "true" | "false" | "";
  page?: number;
  limit?: number;
};

export const superAdminService = {
  getOverview: () => apiRequest<AdminOverview>("/admin/overview"),
  getStores: (params: AdminStoresParams = {}) => apiRequest<ListResponse<AdminStoreListItem>>(`/admin/stores${toQuery(params)}`),
  getStore: (id: string) => apiRequest<AdminStoreDetails>(`/admin/stores/${id}`),
  createStore: (payload: CreateAdminStoreRequest) => apiRequest<{ store: unknown; branch: unknown; ownerUser: unknown; subscription: Subscription }>("/admin/stores", { method: "POST", body: JSON.stringify(payload) }),
  updateStore: (id: string, payload: { name?: string; ownerName?: string; phone?: string; email?: string | null }) => apiRequest<AdminStoreDetails>(`/admin/stores/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateStoreStatus: (id: string, status: StoreStatus) => apiRequest<AdminStoreDetails>(`/admin/stores/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getSubscriptions: (params: AdminSubscriptionsParams = {}) => apiRequest<ListResponse<Subscription>>(`/admin/subscriptions${toQuery(params)}`),
  getSubscription: (id: string) => apiRequest<Subscription>(`/admin/subscriptions/${id}`),
  updateSubscription: (id: string, payload: Partial<Pick<Subscription, "planId" | "status" | "startDate" | "endDate" | "trialEndsAt" | "billingCycle" | "notes">>) =>
    apiRequest<Subscription>(`/admin/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  renewSubscription: (id: string, payload: { months?: number; amount: number; paymentMethod: string; reference?: string; notes?: string }) =>
    apiRequest<Subscription>(`/admin/subscriptions/${id}/renew`, { method: "POST", body: JSON.stringify(payload) }),
};
