import type { SubscriptionPlan, SubscriptionPlanStatus } from "../types";
import { apiRequest } from "./apiClient";

export const plansService = {
  getPlans: () => apiRequest<SubscriptionPlan[]>("/admin/plans"),
  getPlan: (id: string) => apiRequest<SubscriptionPlan>(`/admin/plans/${id}`),
  createPlan: (payload: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt" | "_count">) =>
    apiRequest<SubscriptionPlan>("/admin/plans", { method: "POST", body: JSON.stringify(payload) }),
  updatePlan: (id: string, payload: Partial<Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt" | "_count">>) =>
    apiRequest<SubscriptionPlan>(`/admin/plans/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updatePlanStatus: (id: string, status: SubscriptionPlanStatus) =>
    apiRequest<SubscriptionPlan>(`/admin/plans/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
