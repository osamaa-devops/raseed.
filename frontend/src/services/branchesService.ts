import type { Branch } from "../types";
import { apiRequest } from "./apiClient";

export const branchesService = {
  getBranches: () => apiRequest<Branch[]>("/branches"),
};
