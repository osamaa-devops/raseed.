import type { BarcodeLabelSettings, ReceiptSettings } from "../types";
import { apiRequest } from "./apiClient";

export type ReceiptSettingsPayload = Partial<Omit<ReceiptSettings, "id" | "storeId" | "createdAt" | "updatedAt">>;
export type BarcodeLabelSettingsPayload = Partial<Omit<BarcodeLabelSettings, "id" | "storeId" | "createdAt" | "updatedAt">>;

export const settingsService = {
  getReceiptSettings: (branchId?: string) =>
    apiRequest<ReceiptSettings>(`/settings/receipt${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`),
  updateReceiptSettings: (payload: ReceiptSettingsPayload) =>
    apiRequest<ReceiptSettings>("/settings/receipt", { method: "PATCH", body: JSON.stringify(serializeReceiptSettingsPayload(payload)) }),
  getBarcodeLabelSettings: () =>
    apiRequest<BarcodeLabelSettings>("/settings/barcode-labels"),
  updateBarcodeLabelSettings: (payload: BarcodeLabelSettingsPayload) =>
    apiRequest<BarcodeLabelSettings>("/settings/barcode-labels", { method: "PATCH", body: JSON.stringify(serializeBarcodeSettingsPayload(payload)) }),
};

function serializeReceiptSettingsPayload(payload: ReceiptSettingsPayload) {
  const {
    branchId,
    storeName,
    storePhone,
    storeAddress,
    logoUrl,
    receiptHeader,
    receiptFooter,
    showLogo,
    showTaxNumber,
    taxNumber,
    showCashierName,
    showBranchName,
    showCustomerInfo,
    paperSize,
  } = payload;

  return {
    branchId,
    storeName,
    storePhone,
    storeAddress,
    logoUrl,
    receiptHeader,
    receiptFooter,
    showLogo,
    showTaxNumber,
    taxNumber,
    showCashierName,
    showBranchName,
    showCustomerInfo,
    paperSize,
  };
}

function serializeBarcodeSettingsPayload(payload: BarcodeLabelSettingsPayload) {
  const {
    labelSize,
    showProductName,
    showPrice,
    showBarcodeText,
    columns,
    rows,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = payload;

  return {
    labelSize,
    showProductName,
    showPrice,
    showBarcodeText,
    columns,
    rows,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  };
}
