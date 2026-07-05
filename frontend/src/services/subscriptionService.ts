import type { StoreUsage, SubscriptionPayment, SubscriptionPlan, SubscriptionStatus, BillingCycle, Store } from "../types";
import { apiRequest } from "./apiClient";

export type MySubscriptionResponse = {
  store: Store;
  currentPlan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
  startDate: string | null;
  endDate: string | null;
  trialEndsAt: string | null;
  billingCycle: BillingCycle | null;
  amount: number;
  usage: StoreUsage;
  daysRemaining: number | null;
  upgradeOptions: SubscriptionPlan[];
  payments: SubscriptionPayment[];
};

export const subscriptionService = {
  getMySubscription: () => apiRequest<MySubscriptionResponse>("/subscription/me"),
  getUsage: () => apiRequest<StoreUsage>("/subscription/usage"),
};
