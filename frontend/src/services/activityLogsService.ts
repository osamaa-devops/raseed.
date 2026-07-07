import type { ActivityLog, Id, ListResponse } from "../types";
import { apiRequest } from "./apiClient";

export type ActivityLogsParams = {
  userId?: Id | "";
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

function toQuery(params: ActivityLogsParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const activityLogsService = {
  list: (params: ActivityLogsParams = {}) => apiRequest<ListResponse<ActivityLog>>(`/activity-logs${toQuery(params)}`),
};
