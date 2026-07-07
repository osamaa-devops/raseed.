import type { Role } from "../types";
import { apiRequest } from "./apiClient";

export const rolesService = {
  list: () => apiRequest<Role[]>("/roles"),
};
