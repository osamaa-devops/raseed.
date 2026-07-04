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
  { id: "s1", storeId: "store_city_market", branchId: "branch_main", invoiceNumber: "INV-0891", customerName: "محمد علي", total: 187, paymentMethod: "cash", status: "paid", createdAt: "10:32" },
  { id: "s2", storeId: "store_city_market", branchId: "branch_main", invoiceNumber: "INV-0892", total: 63, paymentMethod: "card", status: "paid", createdAt: "11:05" },
  { id: "s3", storeId: "store_city_market", branchId: "branch_1", invoiceNumber: "INV-0894", total: 95, paymentMethod: "wallet", status: "returned", createdAt: "12:10" },
];

export const demoSales: Sale[] = demoInvoices;

export const demoExpenses: Expense[] = [
  { id: "e1", storeId: "store_city_market", branchId: "branch_main", title: "كهرباء الشهر", category: "كهرباء", amount: 650, date: "2026-07-01" },
  { id: "e2", storeId: "store_city_market", branchId: "branch_main", title: "صيانة ثلاجة", category: "صيانة", amount: 300, date: "2026-07-02" },
];
