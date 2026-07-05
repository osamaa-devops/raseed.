import type { BarcodeLabelPayload, BarcodeLabelSettings } from "../types";
import { apiRequest } from "./apiClient";

export const barcodeService = {
  getBarcodeLabelSettings: () => apiRequest<BarcodeLabelSettings>("/settings/barcode-labels"),
  updateBarcodeLabelSettings: (payload: Partial<BarcodeLabelSettings>) =>
    apiRequest<BarcodeLabelSettings>("/settings/barcode-labels", { method: "PATCH", body: JSON.stringify(payload) }),
  generateProductBarcode: (productId: string, force = false) =>
    apiRequest<{ productId: string; barcode: string }>(`/products/${productId}/generate-barcode`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  getBarcodeLabelsPayload: (productIds: string[], copies = 1, autoGenerate = false) =>
    apiRequest<BarcodeLabelPayload>("/products/barcode-labels", {
      method: "POST",
      body: JSON.stringify({ productIds, copies, autoGenerate }),
    }),
};
