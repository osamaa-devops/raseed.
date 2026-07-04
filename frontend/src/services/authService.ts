import { apiRequest } from "./apiClient";

export type AuthUser = {
  id: string;
  storeId: string | null;
  branchId: string | null;
  roleId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  store: { id: string; name: string; status: string } | null;
  branch: { id: string; name: string } | null;
  role: { id: string; name: string; description?: string | null } | null;
  permissions: string[];
};

export const authService = {
  login: (identity: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identity, password }),
    }),
  me: () => apiRequest<AuthResponse>("/auth/me"),
  logout: () => apiRequest<{ success: boolean; message: string }>("/auth/logout", { method: "POST" }),
};
