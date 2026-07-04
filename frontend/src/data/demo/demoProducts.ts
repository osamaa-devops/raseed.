import type { Category, Product } from "../../types";

const now = "2026-07-04T00:00:00.000Z";

export const demoCategories: Category[] = [
  { id: "cat_dairy", storeId: "store_city_market", name: "ألبان", color: "#0f766e", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "cat_grocery", storeId: "store_city_market", name: "بقالة", color: "#d97706", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "cat_drinks", storeId: "store_city_market", name: "مشروبات", color: "#2563eb", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "cat_cleaning", storeId: "store_city_market", name: "منظفات", color: "#7c3aed", status: "ACTIVE", createdAt: now, updatedAt: now },
];

export const demoProducts: Product[] = [
  { id: "p1", storeId: "store_city_market", name: "لبن جهينة", barcode: "6223001234567", categoryId: "cat_dairy", purchasePrice: 13, sellingPrice: 18, profitMargin: 27.78, unitType: "كرتونة", minStock: 20, status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "p2", storeId: "store_city_market", name: "سكر أبيض", barcode: "6223001234568", categoryId: "cat_grocery", purchasePrice: 28, sellingPrice: 35, profitMargin: 20, unitType: "كيلو", minStock: 30, status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "p3", storeId: "store_city_market", name: "أرز مصري", barcode: "6223001234569", categoryId: "cat_grocery", purchasePrice: 35, sellingPrice: 45, profitMargin: 22.22, unitType: "كيلو", minStock: 25, status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "p4", storeId: "store_city_market", name: "زيت خليط", barcode: "6223001234570", categoryId: "cat_grocery", purchasePrice: 42, sellingPrice: 55, profitMargin: 23.64, unitType: "لتر", minStock: 15, status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "p5", storeId: "store_city_market", name: "بيبسي", barcode: "6223001234578", categoryId: "cat_drinks", purchasePrice: 7, sellingPrice: 10, profitMargin: 30, unitType: "علبة", minStock: 48, status: "ACTIVE", createdAt: now, updatedAt: now },
];
