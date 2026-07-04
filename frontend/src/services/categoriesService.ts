import type { Category } from "../types";
import { apiRequest } from "./apiClient";

export type CategoryPayload = {
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
};

export const categoriesService = {
  getCategories: () => apiRequest<Category[]>("/categories"),
  getCategory: (id: string) => apiRequest<Category>(`/categories/${id}`),
  createCategory: (payload: CategoryPayload) =>
    apiRequest<Category>("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: Partial<CategoryPayload>) =>
    apiRequest<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateCategoryStatus: (id: string, status: Category["status"]) =>
    apiRequest<Category>(`/categories/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteCategory: (id: string) =>
    apiRequest<{ success: boolean }>(`/categories/${id}`, { method: "DELETE" }),
};
