import type { ReportResponse } from "../types";
import { apiRequest } from "./apiClient";

export type ReportParams = {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  cashierId?: string;
};

function toQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

type SalesRow = { date?: string; month?: string; totalSales: number; invoicesCount: number };
type ProfitReport = { range: { dateFrom: string; dateTo: string }; revenue: number; estimatedCost: number; grossProfitEstimate: number };
type MethodRow = { method: "CASH" | "CARD" | "WALLET"; total: number; count: number };
type CashierRow = { cashierId: string; cashierName: string; invoicesCount: number; totalSales: number };
type ProductRow = { productId: string; productName: string; quantity: number; sales: number };
type InventoryValueReport = { range: { dateFrom: string; dateTo: string }; totalValue: number; rows: Array<{ productId: string; productName: string; branchName: string; quantity: number; purchasePrice: number; value: number }> };
type ExpenseReportRow = { category: string; total: number; count: number };

export const reportsService = {
  getDailySales: (params: ReportParams = {}) => apiRequest<ReportResponse<SalesRow>>(`/reports/daily-sales${toQuery(params)}`),
  getMonthlySales: (params: ReportParams = {}) => apiRequest<ReportResponse<SalesRow>>(`/reports/monthly-sales${toQuery(params)}`),
  getProfit: (params: ReportParams = {}) => apiRequest<ProfitReport>(`/reports/profit${toQuery(params)}`),
  getPaymentMethods: (params: ReportParams = {}) => apiRequest<ReportResponse<MethodRow>>(`/reports/payment-methods${toQuery(params)}`),
  getCashierPerformance: (params: ReportParams = {}) => apiRequest<ReportResponse<CashierRow>>(`/reports/cashier-performance${toQuery(params)}`),
  getBestSellingProducts: (params: ReportParams = {}) => apiRequest<ReportResponse<ProductRow>>(`/reports/best-selling-products${toQuery(params)}`),
  getWorstSellingProducts: (params: ReportParams = {}) => apiRequest<ReportResponse<ProductRow>>(`/reports/worst-selling-products${toQuery(params)}`),
  getInventoryValue: (params: ReportParams = {}) => apiRequest<InventoryValueReport>(`/reports/inventory-value${toQuery(params)}`),
  getExpensesReport: (params: ReportParams = {}) => apiRequest<{ range: { dateFrom: string; dateTo: string }; total: number; rows: ExpenseReportRow[] }>(`/reports/expenses${toQuery(params)}`),
};
