import type { DemoRequest, DemoRequestStatus, ListResponse } from "../types";
import { apiRequest } from "./apiClient";

type QueryValue = string | number | undefined;

function toQuery(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export type DemoRequestsParams = {
  search?: string;
  status?: DemoRequestStatus | "";
  page?: number;
  limit?: number;
};

export type CreateDemoRequestPayload = {
  storeName: string;
  ownerName: string;
  phone: string;
  email?: string;
  businessType: string;
  notes?: string;
};

export const demoRequestsService = {
  create: (payload: CreateDemoRequestPayload) => apiRequest<DemoRequest>("/demo-requests", { method: "POST", body: JSON.stringify(payload), skipAuthRetry: true }),
  list: (params: DemoRequestsParams = {}) => apiRequest<ListResponse<DemoRequest>>(`/admin/demo-requests${toQuery(params)}`),
  update: (id: string, payload: { status?: DemoRequestStatus; notes?: string }) =>
    apiRequest<DemoRequest>(`/admin/demo-requests/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
};
