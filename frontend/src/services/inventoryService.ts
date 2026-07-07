import type { InventoryBatch, InventoryMovement, InventoryStock, InventoryTransfer } from "../types";
import { apiRequest } from "./apiClient";

type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type InventoryStocksParams = {
  branchId?: string;
  search?: string;
  categoryId?: string;
  status?: InventoryStock["stockStatus"] | "";
  page?: number;
  limit?: number;
};

export type InventoryMovementsParams = {
  branchId?: string;
  productId?: string;
  type?: InventoryMovement["type"] | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type InventoryTransfersParams = {
  branchId?: string;
  productId?: string;
  status?: InventoryTransfer["status"] | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type AddStockPayload = {
  branchId: string;
  productId: string;
  quantity: number;
  purchasePrice?: number;
  expiryDate?: string;
  batchNumber?: string;
  reason?: string;
  notes?: string;
};

export type RemoveStockPayload = {
  branchId: string;
  productId: string;
  quantity: number;
  type: "REMOVE_STOCK" | "DAMAGE" | "EXPIRED";
  reason: string;
  notes?: string;
};

export type AdjustStockPayload = {
  branchId: string;
  productId: string;
  newQuantity: number;
  reason: string;
  notes?: string;
};

export type TransferStockPayload = {
  sourceBranchId: string;
  destinationBranchId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reason?: string;
  notes?: string;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const inventoryService = {
  getInventoryStocks: (params: InventoryStocksParams = {}) =>
    apiRequest<ListResponse<InventoryStock>>(`/inventory/stocks${toQuery(params)}`),

  getInventoryStock: (productId: string, branchId?: string) =>
    apiRequest<InventoryStock>(`/inventory/stocks/${productId}${toQuery({ branchId })}`),

  getInventoryMovements: (params: InventoryMovementsParams = {}) =>
    apiRequest<ListResponse<InventoryMovement>>(`/inventory/movements${toQuery(params)}`),

  getInventoryTransfers: (params: InventoryTransfersParams = {}) =>
    apiRequest<ListResponse<InventoryTransfer>>(`/inventory/transfers${toQuery(params)}`),

  addStock: (payload: AddStockPayload) =>
    apiRequest<InventoryStock>("/inventory/add-stock", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  removeStock: (payload: RemoveStockPayload) =>
    apiRequest<InventoryStock>("/inventory/remove-stock", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adjustStock: (payload: AdjustStockPayload) =>
    apiRequest<InventoryStock>("/inventory/adjust", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  transferStock: (payload: TransferStockPayload) =>
    apiRequest<InventoryTransfer>("/inventory/transfer", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getLowStock: (params: InventoryStocksParams = {}) =>
    apiRequest<ListResponse<InventoryStock>>(`/inventory/low-stock${toQuery(params)}`),

  getExpiryAlerts: (params: { branchId?: string; days?: number } = {}) =>
    apiRequest<InventoryBatch[]>(`/inventory/expiry-alerts${toQuery(params)}`),
};
