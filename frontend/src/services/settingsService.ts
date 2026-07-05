import type { BarcodeLabelSettings, ReceiptSettings } from "../types";
import { apiRequest } from "./apiClient";

export type ReceiptSettingsPayload = Partial<Omit<ReceiptSettings, "id" | "storeId" | "createdAt" | "updatedAt">>;
export type BarcodeLabelSettingsPayload = Partial<Omit<BarcodeLabelSettings, "id" | "storeId" | "createdAt" | "updatedAt">>;

export const settingsService = {
  getReceiptSettings: (branchId?: string) =>
    apiRequest<ReceiptSettings>(`/settings/receipt${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`),
  updateReceiptSettings: (payload: ReceiptSettingsPayload) =>
    apiRequest<ReceiptSettings>("/settings/receipt", { method: "PATCH", body: JSON.stringify(payload) }),
  getBarcodeLabelSettings: () =>
    apiRequest<BarcodeLabelSettings>("/settings/barcode-labels"),
  updateBarcodeLabelSettings: (payload: BarcodeLabelSettingsPayload) =>
    apiRequest<BarcodeLabelSettings>("/settings/barcode-labels", { method: "PATCH", body: JSON.stringify(payload) }),
};
