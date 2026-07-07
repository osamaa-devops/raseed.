import type { Permission } from "../types";
import { apiRequest } from "./apiClient";

export const permissionsService = {
  list: () => apiRequest<Permission[]>("/permissions"),
};
