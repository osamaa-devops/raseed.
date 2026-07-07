import type { Branch } from "../types";
import { apiRequest } from "./apiClient";

export type CreateBranchRequest = {
  name: string;
  address?: string;
  phone?: string;
};

export type UpdateBranchRequest = Partial<CreateBranchRequest>;

export const branchesService = {
  getBranches: () => apiRequest<Branch[]>("/branches"),
  create: (payload: CreateBranchRequest) => apiRequest<Branch>("/branches", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateBranchRequest) => apiRequest<Branch>(`/branches/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateStatus: (id: string, status: NonNullable<Branch["status"]>) => apiRequest<Branch>(`/branches/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
