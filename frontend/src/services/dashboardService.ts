import type { DashboardOverview } from "../types";
import { apiRequest } from "./apiClient";

function toQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const dashboardService = {
  getOverview: (params: { branchId?: string; date?: string } = {}) => apiRequest<DashboardOverview>(`/dashboard/overview${toQuery(params)}`),
};
