import type { ExportFormat, ImportPreviewResult, ImportSummary, ProductImportMode, StockImportMode } from "../types";
import { apiRequest, getApiBaseUrl, AUTH_STORAGE_KEY } from "./apiClient";

type Filters = Record<string, string | number | undefined>;

function authToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw).accessToken as string | undefined : undefined;
  } catch {
    return undefined;
  }
}

function query(params: Filters = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

async function upload<T>(path: string, file: File, params: Filters = {}) {
  const form = new FormData();
  form.set("file", file);
  const token = authToken();
  const response = await fetch(`${getApiBaseUrl()}${path}${query(params)}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? body?.message ?? `Upload failed: ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }
  return response.json() as Promise<T>;
}

async function download(path: string, filename: string, params: Filters = {}) {
  const token = authToken();
  const response = await fetch(`${getApiBaseUrl()}${path}${query(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? body?.message ?? `Download failed: ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const importExportService = {
  downloadProductTemplate: (format: ExportFormat) => download(`/import-export/templates/products.${format}`, `products-template.${format}`),
  downloadInitialStockTemplate: (format: ExportFormat) => download(`/import-export/templates/initial-stock.${format}`, `initial-stock-template.${format}`),
  previewProductsImport: (file: File, mode: ProductImportMode) => upload<ImportPreviewResult>("/import-export/products/preview", file, { mode }),
  importProducts: (file: File, mode: ProductImportMode) => upload<ImportSummary>("/import-export/products/import", file, { mode }),
  previewInitialStockImport: (file: File, mode: StockImportMode) => upload<ImportPreviewResult>("/import-export/initial-stock/preview", file, { mode }),
  importInitialStock: (file: File, mode: StockImportMode) => upload<ImportSummary>("/import-export/initial-stock/import", file, { mode }),
  exportProducts: (format: ExportFormat, filters: Filters = {}) => download("/import-export/products", `products.${format}`, { ...filters, format }),
  exportInventory: (format: ExportFormat, filters: Filters = {}) => download("/import-export/inventory", `inventory.${format}`, { ...filters, format }),
  exportInvoices: (format: ExportFormat, filters: Filters = {}) => download("/import-export/invoices", `invoices.${format}`, { ...filters, format }),
  exportExpenses: (format: ExportFormat, filters: Filters = {}) => download("/import-export/expenses", `expenses.${format}`, { ...filters, format }),
  exportCustomers: (format: ExportFormat, filters: Filters = {}) => download("/import-export/customers", `customers.${format}`, { ...filters, format }),
  exportSuppliers: (format: ExportFormat, filters: Filters = {}) => download("/import-export/suppliers", `suppliers.${format}`, { ...filters, format }),
  exportDailySalesReport: (format: ExportFormat, filters: Filters = {}) => download("/import-export/reports/daily-sales", `daily-sales-report.${format}`, { ...filters, format }),
  exportProfitReport: (format: ExportFormat, filters: Filters = {}) => download("/import-export/reports/profit", `profit-report.${format}`, { ...filters, format }),
  exportInventoryValueReport: (format: ExportFormat, filters: Filters = {}) => download("/import-export/reports/inventory-value", `inventory-value-report.${format}`, { ...filters, format }),
};
