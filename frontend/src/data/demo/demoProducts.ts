import type { Category, Product } from "../../types";

export const demoCategories: Category[] = [
  { id: "cat_dairy", storeId: "store_city_market", name: "ألبان", color: "#0f766e" },
  { id: "cat_grocery", storeId: "store_city_market", name: "بقالة", color: "#d97706" },
  { id: "cat_drinks", storeId: "store_city_market", name: "مشروبات", color: "#2563eb" },
  { id: "cat_cleaning", storeId: "store_city_market", name: "منظفات", color: "#7c3aed" },
];

export const demoProducts: Product[] = [
  { id: "p1", storeId: "store_city_market", name: "لبن جهينة", barcode: "6223001234567", categoryId: "cat_dairy", price: 18, cost: 13, stock: 48, minStock: 20 },
  { id: "p2", storeId: "store_city_market", name: "سكر أبيض", barcode: "6223001234568", categoryId: "cat_grocery", price: 35, cost: 28, stock: 120, minStock: 30 },
  { id: "p3", storeId: "store_city_market", name: "أرز مصري", barcode: "6223001234569", categoryId: "cat_grocery", price: 45, cost: 35, stock: 8, minStock: 25 },
  { id: "p4", storeId: "store_city_market", name: "زيت خليط", barcode: "6223001234570", categoryId: "cat_grocery", price: 55, cost: 42, stock: 60, minStock: 15 },
  { id: "p5", storeId: "store_city_market", name: "بيبسي", barcode: "6223001234578", categoryId: "cat_drinks", price: 10, cost: 7, stock: 144, minStock: 48 },
];
