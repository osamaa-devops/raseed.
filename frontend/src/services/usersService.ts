import type { Id, User, UserStatus } from "../types";
import { apiRequest } from "./apiClient";

export type CreateUserRequest = {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  roleId: Id;
  branchId?: Id;
  status?: UserStatus;
};

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, "password" | "branchId">> & { password?: string; branchId?: Id | null };

export const usersService = {
  list: () => apiRequest<User[]>("/users"),
  get: (id: Id) => apiRequest<User>(`/users/${id}`),
  create: (payload: CreateUserRequest) => apiRequest<User>("/users", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: Id, payload: UpdateUserRequest) => apiRequest<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateStatus: (id: Id, status: UserStatus) => apiRequest<User>(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  permissions: (id: Id) => apiRequest<string[]>(`/users/${id}/permissions`),
};
