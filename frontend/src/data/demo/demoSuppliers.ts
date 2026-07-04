import type { Customer, Supplier } from "../../types";

export const demoSuppliers: Supplier[] = [
  { id: "sup1", storeId: "store_city_market", name: "شركة النور للتوريدات", phone: "01001234567", balance: -1200 },
  { id: "sup2", storeId: "store_city_market", name: "مورد المدينة", phone: "01112345678", balance: 0 },
];

export const demoCustomers: Customer[] = [
  { id: "c1", storeId: "store_city_market", name: "محمد علي", phone: "01001111111", status: "ACTIVE", currentDebt: 350, loyaltyPoints: 120, createdAt: "2026-07-04", updatedAt: "2026-07-04" },
  { id: "c2", storeId: "store_city_market", name: "أحمد حسن", phone: "01002222222", status: "ACTIVE", currentDebt: 0, loyaltyPoints: 85, createdAt: "2026-07-04", updatedAt: "2026-07-04" },
];
