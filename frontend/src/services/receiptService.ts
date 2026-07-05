import type { ReceiptPayload, ReceiptSettings } from "../types";
import { apiRequest } from "./apiClient";

export const receiptService = {
  getReceiptSettings: (branchId?: string) =>
    apiRequest<ReceiptSettings>(`/settings/receipt${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`),
  updateReceiptSettings: (payload: Partial<ReceiptSettings>) =>
    apiRequest<ReceiptSettings>("/settings/receipt", { method: "PATCH", body: JSON.stringify(payload) }),
  getInvoiceReceipt: (invoiceId: string) =>
    apiRequest<ReceiptPayload>(`/invoices/${invoiceId}/receipt`),
};
