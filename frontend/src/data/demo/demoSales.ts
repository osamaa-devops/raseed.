import type { Expense, Invoice, Sale } from "../../types";

export const demoSalesTrend = [
  { day: "السبت", sales: 4200, profit: 1100 },
  { day: "الأحد", sales: 3800, profit: 980 },
  { day: "الاثنين", sales: 5100, profit: 1350 },
  { day: "الثلاثاء", sales: 4700, profit: 1220 },
  { day: "الأربعاء", sales: 6200, profit: 1680 },
  { day: "الخميس", sales: 7100, profit: 1900 },
  { day: "الجمعة", sales: 8500, profit: 2300 },
];

export const demoInvoices: Invoice[] = [
  { id: "s1", storeId: "store_city_market", branchId: "branch_main", invoiceNumber: "INV-0891", customerName: "محمد علي", subtotal: 187, discountTotal: 0, taxTotal: 0, total: 187, paidAmount: 187, changeAmount: 0, status: "PAID", createdAt: "2026-07-04T10:32:00.000Z" },
  { id: "s2", storeId: "store_city_market", branchId: "branch_main", invoiceNumber: "INV-0892", subtotal: 63, discountTotal: 0, taxTotal: 0, total: 63, paidAmount: 63, changeAmount: 0, status: "PAID", createdAt: "2026-07-04T11:05:00.000Z" },
  { id: "s3", storeId: "store_city_market", branchId: "branch_1", invoiceNumber: "INV-0894", subtotal: 95, discountTotal: 0, taxTotal: 0, total: 95, paidAmount: 95, changeAmount: 0, status: "REFUNDED", createdAt: "2026-07-04T12:10:00.000Z" },
];

export const demoSales: Sale[] = [
  { id: "s1", storeId: "store_city_market", branchId: "branch_main", invoiceNumber: "INV-0891", total: 187, paymentMethod: "cash", createdAt: "2026-07-04T10:32:00.000Z" },
  { id: "s2", storeId: "store_city_market", branchId: "branch_main", invoiceNumber: "INV-0892", total: 63, paymentMethod: "card", createdAt: "2026-07-04T11:05:00.000Z" },
  { id: "s3", storeId: "store_city_market", branchId: "branch_1", invoiceNumber: "INV-0894", total: 95, paymentMethod: "wallet", createdAt: "2026-07-04T12:10:00.000Z" },
];

export const demoExpenses: Expense[] = [
  { id: "e1", storeId: "store_city_market", branchId: "branch_main", userId: "u1", title: "كهرباء الشهر", category: "ELECTRICITY", amount: 650, expenseDate: "2026-07-01", createdAt: "2026-07-01", updatedAt: "2026-07-01" },
  { id: "e2", storeId: "store_city_market", branchId: "branch_main", userId: "u1", title: "صيانة ثلاجة", category: "MAINTENANCE", amount: 300, expenseDate: "2026-07-02", createdAt: "2026-07-02", updatedAt: "2026-07-02" },
];
