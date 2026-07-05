import type { Product } from "../types";
import { apiRequest } from "./apiClient";

export type ProductPayload = {
  name: string;
  categoryId?: string | null;
  barcode?: string | null;
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  unitType: string;
  minStock: number;
  expiryDate?: string | null;
};

export type ProductListParams = {
  search?: string;
  categoryId?: string;
  status?: Product["status"];
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "sellingPrice";
  sortDir?: "asc" | "desc";
};

export type ProductListResponse = {
  items: Product[];
  meta: { page: number; limit: number; total: number; pages: number };
};

function toQuery(params: ProductListParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const productsService = {
  getProducts: (params: ProductListParams = {}) =>
    apiRequest<ProductListResponse>(`/products${toQuery(params)}`),
  getProduct: (id: string) => apiRequest<Product>(`/products/${id}`),
  createProduct: (payload: ProductPayload) =>
    apiRequest<Product>("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<ProductPayload>) =>
    apiRequest<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateProductStatus: (id: string, status: Product["status"]) =>
    apiRequest<Product>(`/products/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  generateBarcode: (id: string, force = false) =>
    apiRequest<{ productId: string; barcode: string }>(`/products/${id}/generate-barcode`, { method: "POST", body: JSON.stringify({ force }) }),
  deleteProduct: (id: string) =>
    apiRequest<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }),
};
